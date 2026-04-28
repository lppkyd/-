// pages/favorites/favorites.js
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
  // 修正：从 records 改为 favorites 完美匹配 WXML 的 wx:for="{{favorites}}"
  data: { favorites: [], loginUser: null, isLoading: false, settings: {} },
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
      const list = extractList(res);
      if (list) {
        const favorites = list.map(item => ({
           ...item,
           // 修正：匹配 WXML 中需要的 {{item.transText}}
           transText: typeof item.trans === 'string' ? item.trans : (Array.isArray(item.trans) ? item.trans.join('; ') : '暂无释义')
        }));
        this.setData({ favorites, isLoading: false });
        return;
      }
    } catch (err) { console.error('获取收藏失败:', err); } 
    finally { wx.hideNavigationBarLoading(); }

    // Fallback 降级读取
    const fallbackRecords = storage.getFavoritesByUser(userId).map(item => ({
        ...item,
        transText: typeof item.trans === 'string' ? item.trans : (Array.isArray(item.trans) ? item.trans.join('; ') : '暂无释义')
    }));
    this.setData({ favorites: fallbackRecords, isLoading: false });
  },

  async removeFavorite(e) {
    const id = e.currentTarget.dataset.id; // WXML 中绑定的是 item.id
    const item = this.data.favorites.find(i => i.id === id) || this.data.favorites.find(i => i.word === id);
    if(!item) return;

    const userId = this.data.loginUser.userId;
    try {
      if (item.id && typeof item.id === 'number') await api.deleteFavorite(item.id);
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
  
  goBack() { wx.navigateBack({ delta: 1 }) },
  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) }
})