// pages/history/history.js
const storage = require('../../utils/storage.js')
const api = require('../../utils/api.js') // 引入 api

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
      // 1. Database-first: 优先从云端拉取
      const res = await api.getUserStudyRecords(userId);
      if (res && res.data) {
        const records = res.data.map(item => ({ 
          ...item, 
          timeText: item.createdAt ? new Date(item.createdAt).toLocaleString() : '' 
        }));
        this.setData({ records, isLoading: false });
        return; // 云端获取成功，直接返回
      }
    } catch (err) {
      console.error('云端获取历史记录失败，降级读取本地缓存:', err);
    } finally {
      wx.hideNavigationBarLoading();
    }

    // 2. Fallback: 接口失败时使用本地兜底
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