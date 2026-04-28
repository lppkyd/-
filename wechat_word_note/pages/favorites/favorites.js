// pages/favorites/favorites.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');
const snapshot = require('../../utils/snapshot.js');
const audio = require('../../utils/audio.js');

Page({
  data: { records: [], loginUser: null, isLoading: false, settings: {} },
  onLoad() { this.setData({ settings: storage.getSettings() }); this.loadData(); },
  onShow() { this.loadData(); },

  async loadData() {
    const loginUser = storage.getLoginUser();
    const userId = loginUser && loginUser.userId ? loginUser.userId : '';
    this.setData({ loginUser, isLoading: true });
    if (!userId) { this.setData({ isLoading: false }); return; }

    wx.showNavigationBarLoading();
    try {
      const res = await api.getUserFavorites(userId);
      if (res && res.data) {
        this.setData({ records: res.data, isLoading: false });
        return;
      }
    } catch (err) { console.error('获取收藏失败:', err); } 
    finally { wx.hideNavigationBarLoading(); }

    const records = storage.getFavoritesByUser(userId);
    this.setData({ records, isLoading: false });
  },

  async removeFavorite(e) {
    const item = e.currentTarget.dataset.item;
    const userId = this.data.loginUser.userId;
    try {
      if (item.id) await api.deleteFavorite(item.id);
      storage.toggleFavorite({ name: item.word }, userId);
    } catch(err) {
      storage.toggleFavorite({ name: item.word }, userId);
      snapshot.syncSnapshot();
    }
    this.loadData();
  },

  playSound(e) {
    const word = e.currentTarget.dataset.word;
    audio.playPronunciation(word, this.data.settings.pronunciationType || 'uk').catch(() => {});
  },
  goBack() { wx.navigateBack({ delta: 1 }) }
})