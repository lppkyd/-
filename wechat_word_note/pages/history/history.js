// pages/history/history.js
const storage = require('../../utils/storage.js')

Page({
  data: { records: [], loginUser: null },
  onLoad() { this.loadData() },
  onShow() { this.loadData() },
  loadData() { const loginUser = storage.getLoginUser(); const userId = loginUser && loginUser.userId ? loginUser.userId : ''; const records = storage.getStudyRecordsByUser(userId).map(item => ({ ...item, timeText: item.createdAt ? new Date(item.createdAt).toLocaleString() : '' })); this.setData({ records, loginUser }) },
  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goBack() { wx.navigateBack({ delta: 1 }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) },
})
