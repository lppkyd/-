// pages/word-list/word-list.js
const dictUtil = require('../../utils/dict.js')
const storage = require('../../utils/storage.js')

Page({
  data: {
    dictId: '',
    dictInfo: null,
    words: [],
    loginUser: null,
  },

  async onLoad(options) {
    const dictId = options.dictId || storage.getSettings().currentDictId
    this.setData({ dictId, loginUser: storage.getLoginUser() })
    await this.loadWords(dictId)
  },

  async loadWords(dictId) {
    await dictUtil.refreshRemoteData()
    const dictInfo = dictUtil.getDictInfo(dictId)
    const words = dictUtil.getDictData(dictId) || []
    this.setData({ dictInfo, words })
  },

  goTyping() {
    const { dictId } = this.data
    storage.updateSettings({ currentDictId: dictId, currentChapter: 0 })
    wx.redirectTo({ url: '/pages/typing/typing' })
  },

  saveToWords(e) {
    const word = e.currentTarget.dataset.word
    const userId = this.data.loginUser && this.data.loginUser.userId ? this.data.loginUser.userId : ''
    if (!word || !userId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    storage.addSavedWord({
      name: word.name || word.word,
      trans: word.trans || [word.meaning],
      usphone: word.usphone || word.phonetic || '',
      ukphone: word.ukphone || word.phonetic || '',
      example: word.example || '',
    }, userId)
    wx.showToast({ title: '已保存到生词本', icon: 'success' })
  },
})
