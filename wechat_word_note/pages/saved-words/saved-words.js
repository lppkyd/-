// pages/saved-words/saved-words.js
const storage = require('../../utils/storage.js')
const audio = require('../../utils/audio.js')
const api = require('../../utils/api.js')

Page({
  data: { words: [], loginUser: null },
  onLoad() { this.loadData() },
  onShow() { this.loadData() },
  async loadData() {
    const loginUser = storage.getLoginUser()
    const userId = loginUser && loginUser.userId ? loginUser.userId : ''
    if (!userId) return this.setData({ words: [], loginUser })
    try {
      const res = await api.getUserSavedWords(userId)
      this.setData({ words: res.data || [], loginUser })
    } catch (e) {
      this.setData({ words: [], loginUser })
    }
  },
  playSound(e) { const word = e.currentTarget.dataset.word; audio.playPronunciation(word, storage.getSettings().pronunciationType).catch(err => { console.error('播放发音失败:', err) }) },
  async deleteWord(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    await api.deleteSavedWord(id)
    this.loadData()
    wx.showToast({ title: '已删除', icon: 'success' })
  },
  async addToPractice(e) {
    const word = e.currentTarget.dataset.word
    const trans = e.currentTarget.dataset.trans
    const loginUser = this.data.loginUser
    const userId = loginUser && loginUser.userId ? loginUser.userId : ''
    if (!userId) return
    await api.addErrorWord({ userId: Number(userId), word, trans, dictId: 'saved-word' })
    wx.showToast({ title: '已加入错题本', icon: 'success' })
  },
  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goBack() { wx.navigateBack({ delta: 1 }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) },
})
