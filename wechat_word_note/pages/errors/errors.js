// pages/errors/errors.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');
const snapshot = require('../../utils/snapshot.js');

Page({
  data: { records: [], loginUser: null, isLoading: false },
  onLoad() { this.loadData() },
  onShow() { this.loadData() },

  async loadData() {
    const loginUser = storage.getLoginUser();
    const userId = loginUser && loginUser.userId ? loginUser.userId : '';
    this.setData({ loginUser, isLoading: true });
    if (!userId) { this.setData({ isLoading: false }); return; }

    wx.showNavigationBarLoading();
    try {
      // DB-first 读取错题本
      const res = await api.getUserErrors(userId);
      if (res && res.data) {
        this.setData({ records: res.data, isLoading: false });
        return;
      }
    } catch (err) {
      console.error('获取云端错题失败:', err);
    } finally {
      wx.hideNavigationBarLoading();
    }
    
    // Fallback 降级
    const records = storage.getErrorsByUser(userId);
    this.setData({ records, isLoading: false });
  },

  async removeError(e) {
    const item = e.currentTarget.dataset.item;
    const loginUser = this.data.loginUser;
    if(!loginUser) return;
    try {
      if (item.id) await api.deleteErrorWord(item.id);
      storage.removeErrorWord(item.word, loginUser.userId);
    } catch(err) {
      storage.removeErrorWord(item.word, loginUser.userId);
      snapshot.syncSnapshot();
    }
    this.loadData();
  },

  goBack() { wx.navigateBack({ delta: 1 }) }
})