// pages/login/login.js
const ui = require('../../utils/ui.js')
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')

Page({
  data: { role: 'user', username: '', password: '', loading: false },
  onUsernameInput(e) { this.setData({ username: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },
  goRegister() { wx.navigateTo({ url: '/pages/login/register' }) },
  async login() {
    const { username, password } = this.data
    if (!username || !password) return ui.showError('请输入账号和密码')
    try {
      this.setData({ loading: true })
      const result = await api.login('user', username, password)
      storage.setLoginSession('user', result.data)
      wx.reLaunch({ url: '/pages/gallery/gallery' })
    } catch (error) { ui.handleAsyncError(error, '登录失败') } finally { this.setData({ loading: false }) }
  },
})
