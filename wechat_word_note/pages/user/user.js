// pages/user/user.js
const storage = require('../../utils/storage.js')
const ui = require('../../utils/ui.js')

Page({
  data: {
    settings: {},
    errorWords: [],
    favorites: [],
    studyRecords: [],
    savedWords: [],
    loginUser: null,
    stats: { errorCount: 0, favoriteCount: 0, recordCount: 0, savedCount: 0 },
  },

  onLoad() { this.loadData() },
  onShow() { this.loadData() },

  loadData() {
    const settings = storage.getSettings()
    const loginUser = storage.getLoginUser()
    const userId = loginUser && loginUser.userId ? loginUser.userId : ''
    const errorWords = storage.getErrorWordsByUser(userId)
    const favorites = storage.getFavoritesByUser(userId)
    const studyRecords = storage.getStudyRecordsByUser(userId)
    const savedWords = storage.getSavedWordsByUser(userId)

    this.setData({
      settings,
      loginUser,
      errorWords,
      favorites,
      studyRecords,
      savedWords,
      stats: {
        errorCount: errorWords.length,
        favoriteCount: favorites.length,
        recordCount: studyRecords.length,
        savedCount: savedWords.length,
      },
    })
  },

  navToErrors() { wx.navigateTo({ url: '/pages/errors/errors' }) },
  navToFavorites() { wx.navigateTo({ url: '/pages/favorites/favorites' }) },
  navToHistory() { wx.navigateTo({ url: '/pages/history/history' }) },
  navToSavedWords() { wx.navigateTo({ url: '/pages/saved-words/saved-words' }) },
  navToCustomDicts() { wx.navigateTo({ url: '/pages/add-dict/add-dict' }) },
  navToHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          storage.clearLoginSession()
          wx.reLaunch({ url: '/pages/login/login' })
        }
      },
    })
  },

  clearCache() {
    wx.showModal({
      title: '清空数据',
      content: '将清空当前用户错题、收藏、学习记录、生词本和进度，是否继续？',
      success: (res) => {
        if (res.confirm) {
          const userId = this.data.loginUser && this.data.loginUser.userId ? this.data.loginUser.userId : ''
          const errors = storage.getErrorWords().filter(item => String(item.userId || '') !== String(userId || ''))
          const favorites = storage.getFavorites().filter(item => String(item.userId || '') !== String(userId || ''))
          const records = storage.getStudyRecords().filter(item => String(item.userId || '') !== String(userId || ''))
          const savedWords = storage.getSavedWords().filter(item => String(item.userId || '') !== String(userId || ''))
          wx.setStorageSync(storage.KEYS.ERROR_WORDS, errors)
          wx.setStorageSync(storage.KEYS.FAVORITES, favorites)
          wx.setStorageSync(storage.KEYS.STUDY_RECORDS, records)
          wx.setStorageSync(storage.KEYS.SAVED_WORDS, savedWords)
          wx.removeStorageSync(storage.KEYS.PROGRESS)
          wx.showToast({ title: '已清空', icon: 'success' })
          this.loadData()
        }
      },
    })
  },

  showAbout() { ui.showError('单词学习系统：支持词典管理、单词练习、错题、收藏与学习记录。', '关于系统') },
})
