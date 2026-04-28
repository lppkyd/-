// pages/history/history.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');

Page({
  data: { records: [], loginUser: null, isLoading: false },
  onLoad() { this.loadData() },
  onShow() { this.loadData() },

  async loadData() {
    const loginUser = storage.getLoginUser();
    const userId = loginUser && loginUser.userId ? loginUser.userId : '';
    this.setData({ loginUser, isLoading: true });

    if (!userId) {
      this.setData({ isLoading: false });
      return;
    }

    wx.showNavigationBarLoading();
    try {
      // DB-first 读取历史记录
      const res = await api.getUserStudyRecords(userId);
      if (res && res.data) {
        const records = res.data.map(item => ({
          ...item,
          dictName: item.categoryName || item.dictName || '练习记录',
          timeText: item.createdAt ? new Date(item.createdAt).toLocaleString() : ''
        }));
        this.setData({ records, isLoading: false });
        return;
      }
    } catch (err) {
      console.error('云端获取历史记录失败:', err);
    } finally {
      wx.hideNavigationBarLoading();
    }

    // Fallback 降级
    const records = storage.getStudyRecordsByUser(userId).map(item => ({
      ...item,
      timeText: item.createdAt ? new Date(item.createdAt).toLocaleString() : ''
    }));
    this.setData({ records, isLoading: false });
  },

  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goBack() { wx.navigateBack({ delta: 1 }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) },
})