// pages/typing/typing.js
const dictUtil = require('../../utils/dict.js')
const storage = require('../../utils/storage.js')
const audio = require('../../utils/audio.js')
const snapshot = require('../../utils/snapshot.js')
const api = require('../../utils/api.js')

Page({
  data: {
    dictId: 'cet4', chapter: 0, dictName: '', totalChapters: 0, totalWords: 0,
    chapterWords: [], currentWordIndex: 0, currentWord: null, inputValue: '',
    correctCount: 0, wrongCount: 0, showResult: false, showSidebar: false,
    dictList: [], settings: {}, loginUser: null, loginRole: '', maskingMode: 0,
    maskingModes: ['正常显示', '单词遮盖', '中文遮盖'], visibilityMask: [],
    letterStates: [], displayWord: '', loading: true, emptyTip: '', isFavorite: false
  },

  async onLoad(options) { await this.initPage(options) },
  async onShow() { await this.initPage() },

  async initPage(options = {}) {
    this.setData({ loading: true });
    await dictUtil.refreshRemoteData();
    this.loadDictList();
    const settings = storage.getSettings();
    const loginUser = storage.getLoginUser();
    const loginRole = storage.getLoginRole();
    const dictId = options.dictId || settings.currentDictId || 'cet4';
    const chapter = Number(options.chapter || settings.currentChapter || 0);
    const maskingMode = settings.maskingMode || 0;
    this.setData({ dictId, chapter, settings, loginUser, loginRole, maskingMode });
    this.loadChapter();
  },

  getCurrentUserId() { return this.data.loginUser && this.data.loginUser.userId ? this.data.loginUser.userId : ''; },
  async syncSnapshot() { await snapshot.syncSnapshot() },

  loadDictList() {
    const presetDicts = dictUtil.getAllPresetDicts().map(dict => ({ id: dict.id, name: dict.name, chapters: Array.from({ length: dict.totalChapters }, (_, i) => i), expanded: dict.id === 'cet4' }));
    const remoteDicts = dictUtil.getRemoteCategories().map(dict => { const info = dictUtil.getDictInfo(dict.id); return { id: dict.id, name: dict.name, chapters: info ? Array.from({ length: info.totalChapters }, (_, i) => i) : [0], expanded: false } });
    const customDicts = storage.getCustomDicts().map(dict => { const totalChapters = Math.max(1, Math.ceil((dict.words || []).length / 200)); return { id: dict.id, name: dict.name, chapters: Array.from({ length: totalChapters }, (_, i) => i), expanded: false } });
    this.setData({ dictList: [...presetDicts, ...remoteDicts, ...customDicts] });
  },

  loadChapter() {
    const { dictId, chapter } = this.data;
    const dictInfo = dictUtil.getDictInfo(dictId);
    if (!dictInfo) { this.setData({ currentWord: null, chapterWords: [], totalWords: 0, totalChapters: 0, showResult: false, loading: false, emptyTip: '未找到该词典，请返回词库中心重新选择。', isFavorite: false }); return; }
    const words = dictUtil.getChapterWords(dictId, chapter);
    if (words.length === 0) { this.setData({ currentWord: null, chapterWords: [], totalWords: 0, totalChapters: dictInfo.totalChapters, showResult: false, loading: false, emptyTip: '当前章节暂无单词，请切换章节。', isFavorite: false }); return; }
    this.setData({ dictName: dictInfo.name, totalChapters: dictInfo.totalChapters, totalWords: words.length, chapterWords: words, currentWordIndex: 0, currentWord: words[0], inputValue: '', correctCount: 0, wrongCount: 0, showResult: false, loading: false, emptyTip: '' });
    this.updateCurrentWordDisplay();
    this.updateLetterStates();
    this.updateFavoriteState();
  },

  updateFavoriteState() {
    const { currentWord } = this.data;
    const userId = this.getCurrentUserId();
    if (!currentWord) return this.setData({ isFavorite: false });
    const isFavorite = storage.getFavoritesByUser(userId).some(item => item.word === currentWord.name);
    this.setData({ isFavorite });
  },

  async toggleFavorite() {
    const { currentWord, isFavorite } = this.data;
    if (!currentWord) return;
    const userId = this.getCurrentUserId();
    const payload = { userId, wordId: 0, word: currentWord.name, trans: Array.isArray(currentWord.trans) ? currentWord.trans.join(';') : (currentWord.trans || '暂无释义') };

    this.setData({ isFavorite: !isFavorite });
    wx.showToast({ title: !isFavorite ? '已收藏' : '已取消收藏', icon: 'success' });

    try {
      if (!isFavorite) { await api.addFavorite(payload); } 
      else { snapshot.syncSnapshot(); }
      storage.toggleFavorite(currentWord, userId);
    } catch (err) {
      console.error('收藏云端同步失败:', err);
      storage.toggleFavorite(currentWord, userId);
      snapshot.syncSnapshot();
    }
  },

  goBackToGallery() { wx.redirectTo({ url: '/pages/gallery/gallery' }) },
  switchDict() { this.setData({ showSidebar: true }) },
  toggleSidebar() { this.setData({ showSidebar: !this.data.showSidebar }) },
  toggleDictExpand(e) { const dictId = e.currentTarget.dataset.id; const dictList = this.data.dictList.map(item => item.id === dictId ? { ...item, expanded: !item.expanded } : item); this.setData({ dictList }); },
  onSidebarSelectChapter(e) { const dictId = e.currentTarget.dataset.dictid; const chapter = Number(e.currentTarget.dataset.chapter || 0); storage.updateSettings({ currentDictId: dictId, currentChapter: chapter }); this.setData({ dictId, chapter, showSidebar: false }); this.loadChapter(); this.syncSnapshot(); },
  switchMaskingMode() { const maskingMode = (this.data.maskingMode + 1) % this.data.maskingModes.length; this.setData({ maskingMode }); storage.updateSettings({ maskingMode }); this.updateCurrentWordDisplay(); },
  switchTranslationMode() { const next = !this.data.settings.isShowTranslation; const settings = { ...this.data.settings, isShowTranslation: next }; this.setData({ settings }); storage.saveSettings(settings); },
  
  updateCurrentWordDisplay() {
    const { currentWord, maskingMode } = this.data;
    if (!currentWord) return;
    let displayWord = currentWord.name;
    if (maskingMode === 1) displayWord = '□□□□□□';
    if (maskingMode === 2) displayWord = currentWord.name.slice(0, 1) + '□□□□';
    this.setData({ displayWord });
  },

  updateLetterStates() {
    const { currentWord, inputValue } = this.data;
    if (!currentWord) return;
    const letters = currentWord.name.split('');
    const states = letters.map((letter, index) => {
      if (!inputValue) return 'pending';
      if (index < inputValue.length) return inputValue[index].toLowerCase() === letter.toLowerCase() ? 'correct' : 'wrong';
      return 'pending';
    });
    const visibilityMask = letters.map((_, index) => index < inputValue.length);
    this.setData({ letterStates: states, visibilityMask });
  },

  onInput(e) {
    const inputValue = e.detail.value || '';
    this.setData({ inputValue });
    this.updateLetterStates();
    const { currentWord } = this.data;
    if (!currentWord) return;
    if (inputValue.toLowerCase() === currentWord.name.toLowerCase()) this.onWordCorrect();
  },

  async onWordCorrect() {
    const { correctCount, currentWordIndex, chapterWords, dictId, chapter } = this.data;
    const userId = this.getCurrentUserId();
    const nextCorrectCount = correctCount + 1;

    // 核心结算：利用 try...finally 确保“绝对记录”
    if (currentWordIndex + 1 >= chapterWords.length) {
      const accuracy = Math.round(((correctCount + 1) / chapterWords.length) * 100);
      const payload = { userId, categoryName: this.data.dictName || '日常练习', dictName: this.data.dictName || '日常练习', chapter, totalWords: chapterWords.length, accuracy };

      wx.showLoading({ title: '结算中...' });
      try { 
        await api.addStudyRecord(payload); 
      } 
      catch (err) { console.error('结算同步失败:', err); } 
      finally { 
        // 关键补丁：无论云端是否响应，必定将进度存入本地 storage
        storage.addStudyRecord(payload); 
        storage.updateWordProgress(dictId, chapter, currentWordIndex + 1, userId);
        storage.markChapterCompleted(dictId, chapter, userId);
        snapshot.syncSnapshot();

        wx.hideLoading(); 
        this.setData({ correctCount: nextCorrectCount, currentWord: null, showResult: true, isFavorite: false });
      }
      return;
    }

    this.setData({ correctCount: nextCorrectCount, currentWordIndex: currentWordIndex + 1, currentWord: chapterWords[currentWordIndex + 1], inputValue: '' });
    this.updateCurrentWordDisplay();
    this.updateLetterStates();
    this.updateFavoriteState();
    storage.updateSettings({ currentDictId: dictId, currentChapter: chapter });
    this.syncSnapshot();
  },

  async skipWord() {
    const { wrongCount, currentWordIndex, chapterWords, currentWord, dictId, chapter } = this.data;
    if (!currentWord) return;
    const userId = this.getCurrentUserId();

    const transStr = Array.isArray(currentWord.trans) ? currentWord.trans.join(';') : (currentWord.trans || '暂无释义');
    api.addErrorWord({ userId, dictId, word: currentWord.name, trans: transStr }).catch(err => {
      console.error('错题上传云端失败:', err);
      storage.addErrorWord(currentWord, dictId, userId);
      snapshot.syncSnapshot();
    });

    const nextWrongCount = wrongCount + 1;
    if (currentWordIndex + 1 >= chapterWords.length) { this.setData({ wrongCount: nextWrongCount, currentWord: null, showResult: true, isFavorite: false }); return; }

    this.setData({ wrongCount: nextWrongCount, currentWordIndex: currentWordIndex + 1, currentWord: chapterWords[currentWordIndex + 1], inputValue: '' });
    this.updateCurrentWordDisplay();
    this.updateLetterStates();
    this.updateFavoriteState();
    storage.updateSettings({ currentDictId: dictId, currentChapter: chapter });
    this.syncSnapshot();
  },

  playSound() { const { currentWord, settings } = this.data; if (!currentWord) return; audio.playPronunciation(currentWord.name, settings.pronunciationType).catch(() => {}); },
  nextChapter() { const nextChapter = this.data.chapter + 1; const dictInfo = dictUtil.getDictInfo(this.data.dictId); if (!dictInfo || nextChapter >= dictInfo.totalChapters) { wx.showToast({ title: '已经是最后一章', icon: 'none' }); return; } storage.updateSettings({ currentDictId: this.data.dictId, currentChapter: nextChapter }); this.setData({ chapter: nextChapter }); this.loadChapter(); this.syncSnapshot(); },
  loadChapterManually() { this.loadChapter(); this.syncSnapshot(); }
})