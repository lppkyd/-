// pages/errors/errors.js
const storage = require('../../utils/storage.js')
const audio = require('../../utils/audio.js')
const api = require('../../utils/api.js')

Page({
  data: { errorWords: [], settings: {}, sortType: 'wrongCount', loginUser: null },
  onLoad() { this.loadData() },
  onShow() { this.loadData() },
  async loadData() {
    const settings = storage.getSettings()
    const loginUser = storage.getLoginUser()
    const userId = loginUser && loginUser.userId ? loginUser.userId : ''
    if (!userId) return this.setData({ errorWords: [], settings, loginUser })
    try {
      const res = await api.getUserErrors(userId)
      const source = res.data || []
      const errorWords = this.data.sortType === 'time' ? source.sort((a, b) => (b.lastWrongAt || 0) - (a.lastWrongAt || 0)) : source.sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0))
      this.setData({ errorWords, settings, loginUser })
    } catch (e) {
      this.setData({ errorWords: [], settings, loginUser })
    }
  },
  playSound(e) { const word = e.currentTarget.dataset.word; audio.playPronunciation(word, this.data.settings.pronunciationType).catch(() => {}) },
  async practiceWord(e) {
    const word = e.currentTarget.dataset.word
    const trans = e.currentTarget.dataset.trans
    const loginUser = this.data.loginUser
    const userId = loginUser && loginUser.userId ? loginUser.userId : ''
    if (!userId) return
    await api.addSavedWord({ userId: Number(userId), word, trans, usphone: '', ukphone: '', example: '' })
    wx.redirectTo({ url: '/pages/typing/typing' })
  },
  async deleteWord(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    await api.deleteErrorWord(id)
    this.loadData()
    wx.showToast({ title: '已删除', icon: 'success' })
  },
  async clearAll() {
    const loginUser = this.data.loginUser
    const userId = loginUser && loginUser.userId ? loginUser.userId : ''
    if (!userId) return
    await api.clearUserErrors(userId)
    this.loadData()
    wx.showToast({ title: '已清空', icon: 'success' })
  },
  sortByWrongCount() { this.setData({ sortType: 'wrongCount' }); this.loadData() },
  sortByTime() { this.setData({ sortType: 'time' }); this.loadData() },
  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goBack() { wx.navigateBack({ delta: 1 }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) },
})
