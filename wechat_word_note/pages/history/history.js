// pages/history/history.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');

function extractList(res) {
  let data = res;
  if (typeof res === 'string') try { data = JSON.parse(res); } catch (e) {}
  else if (res && typeof res.data === 'string') try { data = JSON.parse(res.data); } catch (e) {}

  let list = [];
  if (Array.isArray(data)) list = data;
  else if (data && Array.isArray(data.data)) list = data.data;
  else if (res && res.data && Array.isArray(res.data)) list = res.data;
  
  return list.map(rawItem => {
    if (typeof rawItem === 'string' && rawItem.trim().startsWith('{')) {
      try { return JSON.parse(rawItem); } catch (e) { return {}; }
    }
    return rawItem;
  });
}

function safeFormatTime(timeStr) {
  if (!timeStr) return '刚刚';
  const safeStr = String(timeStr).replace(/-/g, '/'); 
  const date = new Date(safeStr);
  if (isNaN(date.getTime())) return timeStr; 
  // 优化时间显示格式
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

Page({
  data: { records: [], historyList: [], loginUser: null, isLoading: false },
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
      if (list && list.length > 0) {
        const records = list.map(item => ({
          ...item,
          dictName: item.categoryName || item.dictName || '日常练习',
          timeText: safeFormatTime(item.createdAt || item.created_at)
        }));
        // 核心修复：注入多重别名防止 WXML 找错对象
        this.setData({ records, historyList: records, isLoading: false });
        return;
      }
    } catch (err) { console.error('获取历史记录失败:', err); } 
    finally { wx.hideNavigationBarLoading(); }

    const fallbackRecords = storage.getStudyRecordsByUser(userId).map(item => ({
      ...item, 
      dictName: item.categoryName || item.dictName || '日常练习',
      timeText: safeFormatTime(item.createdAt || item.created_at)
    }));
    this.setData({ records: fallbackRecords, historyList: fallbackRecords, isLoading: false });
  },

  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goBack() { wx.navigateBack({ delta: 1 }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) }
})