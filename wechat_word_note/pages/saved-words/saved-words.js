// pages/saved-words/saved-words.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');
const snapshot = require('../../utils/snapshot.js');
const audio = require('../../utils/audio.js');

function extractList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
  return null;
}

Page({
  data: { words: [], loginUser: null, isLoading: false, settings: {} },
  onLoad() { this.setData({ settings: storage.getSettings() }); this.loadData(); },
  onShow() { this.loadData(); },
  
  async loadData() {
    const loginUser = storage.getLoginUser();
    const userId = loginUser && loginUser.userId ? loginUser.userId : '';
    this.setData({ loginUser, isLoading: true });
    if (!userId) { this.setData({ isLoading: false }); return; }

    wx.showNavigationBarLoading();
    try {
      const res = await api.getUserSavedWords(userId);
      const list = extractList(res);
      if (list) {
        const words = list.map(rawItem => {
          const item = typeof rawItem === 'string' ? JSON.parse(rawItem) : rawItem;
          return {
            ...item, 
            word: item.word || item.name,
            trans: typeof item.trans === 'string' ? item.trans : (Array.isArray(item.trans) ? item.trans.join(', ') : '暂无释义')
          };
        });
        this.setData({ words, isLoading: false });
        return;
      }
    } catch (err) { console.error('云端获取生词失败:', err); } 
    finally { wx.hideNavigationBarLoading(); }

    const fallbackRecords = storage.getSavedWordsByUser(userId).map(item => ({
        ...item,
        word: item.word || item.name,
        trans: typeof item.trans === 'string' ? item.trans : (Array.isArray(item.trans) ? item.trans.join(', ') : '暂无释义')
    }));
    this.setData({ words: fallbackRecords, isLoading: false });
  },

  async deleteWord(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.words.find(i => i.id == id || i.word == id);
    if(!item) return;

    const userId = this.data.loginUser.userId;
    try {
      if (item.id) await api.deleteSavedWord(item.id);
      // 修复：改名为 deleteSavedWord
      storage.deleteSavedWord(item.word || item.name, userId);
    } catch(err) {
      storage.deleteSavedWord(item.word || item.name, userId);
      snapshot.syncSnapshot();
    }
    this.loadData();
  },

  async addToPractice(e) {
    const wordName = e.currentTarget.dataset.word;
    const transStr = e.currentTarget.dataset.trans || '暂无释义';
    const userId = this.data.loginUser.userId;

    wx.showLoading({ title: '加入练习中...' });
    try {
      await api.addErrorWord({ userId: userId, word: wordName, trans: transStr, dictId: 'saved' });
      storage.addErrorWord({ name: wordName, trans: [transStr] }, 'saved', userId);
      wx.hideLoading();
      wx.showToast({ title: '已加入错题本', icon: 'success' });
    } catch(err) {
      console.error('云端加入错题失败:', err);
      storage.addErrorWord({ name: wordName, trans: [transStr] }, 'saved', userId);
      snapshot.syncSnapshot();
      wx.hideLoading();
      wx.showToast({ title: '离线加入成功', icon: 'success' });
    }
  },

  playSound(e) { 
     const word = e.currentTarget.dataset.word; 
     audio.playPronunciation(word, this.data.settings.pronunciationType || 'uk').catch(() => {}); 
  },
  goBack() { wx.navigateBack({ delta: 1 }) },
  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) }
})