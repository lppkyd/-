// pages/gallery/gallery.js
const dictUtil = require('../../utils/dict.js')
const storage = require('../../utils/storage.js')

Page({
  data: {
    presetDicts: [],
    customDicts: [],
    progress: {},
    currentDictId: 'cet4',
  },

  onLoad() { this.loadData() },
  onShow() { this.loadData() },

  async loadData() {
    await dictUtil.refreshRemoteData()

    const presetDicts = dictUtil.getAllPresetDicts().map(dict => {
      const chapters = Array.from({ length: dict.totalChapters }, (_, i) => `第 ${i + 1} 章`)
      return { ...dict, chapterList: chapters }
    })

    const remoteDicts = dictUtil.getRemoteCategories().map(dict => ({ ...dict, chapterList: ['第 1 章'] }))

    const customDicts = storage.getCustomDicts().map(dict => {
      const totalWords = dict.words.length
      const totalChapters = Math.ceil(totalWords / 200)
      const chapters = Array.from({ length: totalChapters }, (_, i) => `第 ${i + 1} 章`)
      return { ...dict, totalChapters, chapterList: chapters }
    })

    const progress = storage.getProgress()
    const settings = storage.getSettings()

    this.setData({ presetDicts: [...presetDicts, ...remoteDicts], customDicts, progress, currentDictId: settings.currentDictId })
  },

  onChapterChange(e) { const dictId = e.currentTarget.dataset.dictid; const chapter = parseInt(e.detail.value); storage.updateSettings({ currentDictId: dictId, currentChapter: chapter }); wx.redirectTo({ url: '/pages/typing/typing' }) },
  viewDictDetail(e) { const dictId = e.currentTarget.dataset.dictid; wx.navigateTo({ url: `/pages/word-list/word-list?dictId=${dictId}` }) },
  selectPresetDict(e) { const dictId = e.currentTarget.dataset.dictid; const chapter = e.currentTarget.dataset.chapter || 0; storage.updateSettings({ currentDictId: dictId, currentChapter: chapter }); wx.redirectTo({ url: '/pages/typing/typing' }) },
  selectCustomDict(e) { const dictId = e.currentTarget.dataset.dictid; storage.updateSettings({ currentDictId: dictId, currentChapter: 0 }); wx.redirectTo({ url: '/pages/typing/typing' }) },
  deleteCustomDict(e) { const dictId = e.currentTarget.dataset.dictid; const dictName = e.currentTarget.dataset.name; wx.showModal({ title: '删除词典', content: `确定要删除「${dictName}」吗？`, confirmColor: '#EF4444', success: (res) => { if (res.confirm) { storage.deleteCustomDict(dictId); this.loadData(); wx.showToast({ title: '已删除', icon: 'success' }) } } }) },
  addDict() { wx.navigateTo({ url: '/pages/add-dict/add-dict' }) },
})
