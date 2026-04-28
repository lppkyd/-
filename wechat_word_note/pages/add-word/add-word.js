// pages/add-word/add-word.js
const storage = require('../../utils/storage.js')
const dictionaryApi = require('../../utils/dictionary-api.js')
const ui = require('../../utils/ui.js')
const snapshot = require('../../utils/snapshot.js')

Page({
  data: { word: '', trans: '', isLooking: false, autoFilled: false, loginUser: null },
  onLoad() { this.loadLoginUser() },
  onShow() { this.loadLoginUser() },
  loadLoginUser() { const loginUser = storage.getLoginUser(); this.setData({ loginUser }) },
  onWordInput(e) { this.setData({ word: e.detail.value, autoFilled: false }) },
  onTransInput(e) { this.setData({ trans: e.detail.value, autoFilled: false }) },
  lookupWord() { const { word } = this.data; if (!word.trim()) { wx.showToast({ title: '请先输入单词', icon: 'none' }); return } this.setData({ isLooking: true }); dictionaryApi.queryWord(word).then((wordObj) => { this.setData({ trans: wordObj.trans.join('\n'), autoFilled: true, isLooking: false }); wx.showToast({ title: '查询成功', icon: 'success', duration: 1500 }) }).catch((err) => { console.error('查词失败:', err); this.setData({ isLooking: false }); ui.showError(err.message || '未找到释义，请手动输入', '查询失败') }) },
  saveWord() { const { word, trans, loginUser } = this.data; if (!loginUser || !loginUser.userId) { ui.showError('请先登录后再保存生词', '未登录'); return } if (!word.trim()) { wx.showToast({ title: '请输入单词', icon: 'none' }); return } if (!trans.trim()) { wx.showToast({ title: '请输入释义', icon: 'none' }); return } const wordObj = { name: word.trim(), trans: [trans.trim()], usphone: '', ukphone: '', example: '' }; const success = storage.addSavedWord(wordObj, loginUser.userId); if (success) { wx.vibrateShort({ type: 'medium' }); wx.showToast({ title: '已加入生词本', icon: 'success' }); this.setData({ word: '', trans: '', autoFilled: false }); snapshot.syncSnapshot(); wx.navigateTo({ url: '/pages/saved-words/saved-words' }) } else { wx.showToast({ title: '添加失败', icon: 'none' }) } },
})
