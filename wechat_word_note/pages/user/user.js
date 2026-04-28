// pages/user/user.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');

// 统一数据提取拦截器
function extractList(res) {
  let list = [];
  if (Array.isArray(res)) list = res;
  else if (res && Array.isArray(res.data)) list = res.data;
  else if (res && res.data && Array.isArray(res.data.data)) list = res.data.data;
  
  return list.map(rawItem => {
    if (typeof rawItem === 'string' && rawItem.startsWith('{')) {
      try { return JSON.parse(rawItem); } catch (e) { return {}; }
    }
    return rawItem;
  });
}

Page({
  data: {
    userInfo: null,
    learnedCount: 0,
    favoriteCount: 0,
    wrongCount: 0,
    savedCount: 0,
    stats: { learnedCount: 0, favoriteCount: 0, wrongCount: 0, savedCount: 0 }
  },

  onLoad() { this.loadData() },
  onShow() { this.loadData() },

  async loadData() {
    const loginUser = storage.getLoginUser();
    this.setData({ userInfo: loginUser });
    if (!loginUser || !loginUser.userId) return;

    const userId = loginUser.userId;

    // 先获取本地数据作为安全底座（离线兜底）
    const localFav = storage.getFavoritesByUser(userId) || [];
    const localErr = storage.getErrorWordsByUser(userId) || [];
    const localSav = storage.getSavedWordsByUser(userId) || [];
    const localRec = storage.getStudyRecordsByUser(userId) || [];
    let localLearned = 0;
    localRec.forEach(r => localLearned += (Number(r.totalWords) || 0));

    try {
      // 1. 并发请求云端真实数据
      const [fRes, eRes, sRes, rRes] = await Promise.all([
         api.getUserFavorites(userId).catch(() => []),
         api.getUserErrors(userId).catch(() => []),
         api.getUserSavedWords(userId).catch(() => []), // 如果后端崩了，这里会变成 []
         api.getUserStudyRecords(userId).catch(() => [])
      ]);

      const fList = extractList(fRes);
      const eList = extractList(eRes);
      const sList = extractList(sRes);
      const rList = extractList(rRes);

      let cloudLearned = 0;
      rList.forEach(item => cloudLearned += (Number(item.totalWords) || 0));

      // 核心修复：云端数据与本地数据取最大值。防止后端抛错返回 [] 导致数据清零！
      const finalStats = {
        favoriteCount: fList.length > 0 ? fList.length : localFav.length,
        wrongCount: eList.length > 0 ? eList.length : localErr.length,
        savedCount: sList.length > 0 ? sList.length : localSav.length,
        learnedCount: cloudLearned > 0 ? cloudLearned : localLearned
      };

      // 注入多种属性命名，兼容所有的 WXML 绑定习惯
      this.setData({
        ...finalStats,
        favoritesCount: finalStats.favoriteCount,
        errorsCount: finalStats.wrongCount,
        stats: finalStats
      });
      return;
    } catch (err) {
      console.error('统计数据拉取失败，降级本地:', err);
    }

    // 2. 完全断网情况下的显示
    const fallbackStats = {
      favoriteCount: localFav.length,
      wrongCount: localErr.length,
      savedCount: localSav.length,
      learnedCount: localLearned
    };

    this.setData({ ...fallbackStats, favoritesCount: localFav.length, errorsCount: localErr.length, stats: fallbackStats });
  },

  navToLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
  navToHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }); },
  navToFavorites() { wx.navigateTo({ url: '/pages/favorites/favorites' }); },
  navToErrors() { wx.navigateTo({ url: '/pages/errors/errors' }); },
  navToSavedWords() { wx.navigateTo({ url: '/pages/saved-words/saved-words' }); },
  navToHistory() { wx.navigateTo({ url: '/pages/history/history' }); },
  navToSettings() { wx.navigateTo({ url: '/pages/settings/settings' }); },
  navToAbout() { wx.navigateTo({ url: '/pages/about/about' }); },
  
  logout() { 
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          storage.clearLoginSession();
          this.setData({ userInfo: null });
          wx.reLaunch({ url: '/pages/gallery/gallery' });
        }
      }
    });
  }
})