// pages/user/user.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');

// 统一数据提取拦截器（强制 JSON 解析防护）
function extractList(res) {
  if (!res) return [];
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

Page({
  data: {
    // 严格对齐 WXML 里的 {{loginUser.nickname}}
    loginUser: null, 
    // 严格对齐 WXML 里的 stats.errorCount / favoriteCount / savedCount / recordCount
    stats: { 
      errorCount: 0, 
      favoriteCount: 0, 
      savedCount: 0, 
      recordCount: 0 
    }
  },

  onLoad() { this.loadData() },
  onShow() { this.loadData() },

  async loadData() {
    const loginUser = storage.getLoginUser();
    this.setData({ loginUser }); // 绑定给 loginUser
    if (!loginUser || !loginUser.userId) return;

    const userId = loginUser.userId;

    // 获取本地数据作为安全底座
    const localFav = storage.getFavoritesByUser ? storage.getFavoritesByUser(userId) : [];
    const localErr = storage.getErrorsByUser ? storage.getErrorsByUser(userId) : (storage.getErrorWordsByUser ? storage.getErrorWordsByUser(userId) : []);
    const localSav = storage.getSavedWordsByUser ? storage.getSavedWordsByUser(userId) : [];
    const localRec = storage.getStudyRecordsByUser ? storage.getStudyRecordsByUser(userId) : [];

    try {
      // 1. 并发请求云端真实数据，失败返回 null 以作标记
      const [fRes, eRes, sRes, rRes] = await Promise.all([
         api.getUserFavorites(userId).catch(() => null),
         api.getUserErrors(userId).catch(() => null),
         api.getUserSavedWords(userId).catch(() => null),
         api.getUserStudyRecords(userId).catch(() => null)
      ]);

      const fList = fRes !== null ? extractList(fRes) : localFav;
      const eList = eRes !== null ? extractList(eRes) : localErr;
      const sList = sRes !== null ? extractList(sRes) : localSav;
      const rList = rRes !== null ? extractList(rRes) : localRec;

      // 组装最终的数据对象，字段名与 WXML 分毫不差
      const finalStats = {
        favoriteCount: fList.length,
        errorCount: eList.length,
        savedCount: sList.length,
        recordCount: rList.length
      };

      this.setData({ stats: finalStats });

    } catch (err) {
      console.error('统计数据拉取崩溃，全面降级本地:', err);
      const fallbackStats = {
        favoriteCount: localFav.length,
        errorCount: localErr.length,
        savedCount: localSav.length,
        recordCount: localRec.length
      };
      this.setData({ stats: fallbackStats });
    }
  },

  // 页面导航方法（全部与 WXML 的 bindtap 对应）
  navToLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
  navToHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }); },
  navToFavorites() { wx.navigateTo({ url: '/pages/favorites/favorites' }); },
  navToErrors() { wx.navigateTo({ url: '/pages/errors/errors' }); },
  navToSavedWords() { wx.navigateTo({ url: '/pages/saved-words/saved-words' }); },
  navToHistory() { wx.navigateTo({ url: '/pages/history/history' }); },
  
  // WXML 中新绑定的 "创建词典" 与 "关于" 方法
  navToCustomDicts() { 
    wx.navigateTo({ url: '/pages/custom-dicts/custom-dicts' }).catch(() => {
      wx.showToast({ title: '该功能建设中', icon: 'none' });
    }); 
  },
  showAbout() { 
    wx.showModal({ title: '关于我们', content: 'Wechat Word Note V2.0\n数据库直连版', showCancel: false }); 
  },
  
  logout() { 
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          storage.clearLoginSession();
          this.setData({ loginUser: null });
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
})