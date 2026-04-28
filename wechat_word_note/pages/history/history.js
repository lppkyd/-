// pages/history/history.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');

function extractList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
  return null;
}

// 终极杀手锏：解决 iOS 和微信引擎下解析 "YYYY-MM-DD" 报错导致不显示的问题
function safeFormatTime(timeStr) {
  if (!timeStr) return '';
  // 将带有中划线的日期强制转成斜杠，iOS 才认识：2026-04-28 -> 2026/04/28
  const safeStr = String(timeStr).replace(/-/g, '/'); 
  const date = new Date(safeStr);
  if (isNaN(date.getTime())) return timeStr; 
  return date.toLocaleString();
}

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
      const res = await api.getUserStudyRecords(userId);
      const list = extractList(res);
      if (list) {
        const records = list.map(item => ({
          ...item,
          dictName: item.categoryName || item.dictName || '练习记录',
          timeText: safeFormatTime(item.createdAt || item.created_at)
        }));
        this.setData({ records, isLoading: false });
        return;
      }
    } catch (err) { console.error('获取历史记录失败:', err); } 
    finally { wx.hideNavigationBarLoading(); }

    const fallbackRecords = storage.getStudyRecordsByUser(userId).map(item => ({
      ...item, 
      dictName: item.dictName || '练习记录',
      timeText: safeFormatTime(item.createdAt)
    }));
    this.setData({ records: fallbackRecords, isLoading: false });
  },

  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goBack() { wx.navigateBack({ delta: 1 }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) }
})