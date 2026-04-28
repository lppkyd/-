// pages/favorites/favorites.js
const storage = require('../../utils/storage.js')
const audio = require('../../utils/audio.js')
const api = require('../../utils/api.js')

Page({
  data: { favorites: [], loginUser: null },
  onLoad() { this.loadData() },
  onShow() { this.loadData() },
  async loadData() {
    const loginUser = storage.getLoginUser()
    const userId = loginUser && loginUser.userId ? loginUser.userId : ''
    if (!userId) return this.setData({ favorites: [], loginUser })
    try {
      const res = await api.getUserFavorites(userId)
      const favorites = (res.data || []).map(item => ({ ...item, transText: item.trans }))
      this.setData({ favorites, loginUser })
    } catch (e) {
      this.setData({ favorites: [], loginUser })
    }
  },
  playSound(e) { const word = e.currentTarget.dataset.word; audio.playPronunciation(word, storage.getSettings().pronunciationType).catch(err => { console.error('播放发音失败:', err) }) },
  async removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    await api.deleteFavorite(id)
    this.loadData()
    wx.showToast({ title: '已取消收藏', icon: 'success' })
  },
  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goBack() { wx.navigateBack({ delta: 1 }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) },
})
