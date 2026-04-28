// pages/login/register.js
const ui = require('../../utils/ui.js')
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')

Page({
  data: {
    nickname: '',
    username: '',
    password: '',
    loading: false,
  },

  onNicknameInput(e) { this.setData({ nickname: e.detail.value }) },
  onUsernameInput(e) { this.setData({ username: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },
  goBack() { wx.navigateBack() },

  async register() {
    const { nickname, username, password } = this.data
    if (!nickname || !username || !password) return ui.showError('请完整填写信息')

    try {
      this.setData({ loading: true })
      const result = await api.request('/auth/login', {
        method: 'POST',
        body: { action: 'register', nickname, username, password },
      })
      storage.setLoginSession('user', result.data)
      wx.reLaunch({ url: '/pages/gallery/gallery' })
    } catch (error) {
      ui.handleAsyncError(error, '注册失败')
    } finally {
      this.setData({ loading: false })
    }
  },
})
