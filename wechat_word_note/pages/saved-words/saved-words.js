// pages/saved-words/saved-words.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');
const snapshot = require('../../utils/snapshot.js');
const audio = require('../../utils/audio.js');

Page({
  data: { records: [], loginUser: null, isLoading: false, settings: {} },
  onLoad() { this.setData({ settings: storage.getSettings() }); this.loadData() },
  onShow() { this.loadData() },
  
  async loadData() {
    const loginUser = storage.getLoginUser();
    const userId = loginUser && loginUser.userId ? loginUser.userId : '';
    this.setData({ loginUser, isLoading: true });
    if (!userId) { this.setData({ isLoading: false }); return; }

    wx.showNavigationBarLoading();
    try {
      // 1. 云端优先获取数据
      const res = await api.getUserSavedWords(userId);
      if (res && res.data) {
        const records = res.data.map(item => ({
          ...item,
          word: item.word || item.name,
          trans: typeof item.trans === 'string' ? item.trans.split('\n') : (item.trans || [])
        }));
        this.setData({ records, isLoading: false });
        return;
      }
    } catch (err) {
      console.error('云端获取生词失败，降级本地:', err);
    } finally { wx.hideNavigationBarLoading(); }

    // 2. Fallback 降级读取本地
    const records = storage.getSavedWordsByUser(userId);
    this.setData({ records, isLoading: false });
  },

  async removeSaved(e) {
    const item = e.currentTarget.dataset.item;
    const userId = this.data.loginUser.userId;
    try {
      if (item.id) await api.deleteSavedWord(item.id);
      storage.removeSavedWord(item.word || item.name, userId);
    } catch(err) {
      storage.removeSavedWord(item.word || item.name, userId);
      snapshot.syncSnapshot();
    }
    this.loadData();
  },

  async addToPractice(e) {
    const item = e.currentTarget.dataset.item;
    const userId = this.data.loginUser.userId;
    const wordName = item.word || item.name;
    const transStr = Array.isArray(item.trans) ? item.trans.join(',') : (item.trans || '');

    wx.showLoading({ title: '加入练习中...' });
    try {
      // 修复 500 报错：确保字段 trans 和 dictId 不为空
      await api.addErrorWord({
        userId: userId,
        word: wordName,
        trans: transStr || '暂无释义', 
        dictId: 'saved' 
      });
      storage.addErrorWord({ name: wordName, trans: item.trans }, 'saved', userId);
      wx.hideLoading();
      wx.showToast({ title: '已加入错题本', icon: 'success' });
    } catch(err) {
      console.error('云端加入错题失败:', err);
      storage.addErrorWord({ name: wordName, trans: item.trans }, 'saved', userId);
      snapshot.syncSnapshot();
      wx.hideLoading();
      wx.showToast({ title: '离线加入成功', icon: 'success' });
    }
  },

  playSound(e) {
    const word = e.currentTarget.dataset.word;
    audio.playPronunciation(word, this.data.settings.pronunciationType || 'uk').catch(() => console.log('播放失败'));
  },

  goBack() { wx.navigateBack({ delta: 1 }) }
})