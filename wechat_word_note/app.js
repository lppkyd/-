App({
  onLaunch() {
    const role = wx.getStorageSync('login_role')
    const user = wx.getStorageSync('login_user')

    if (!role || !user) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }

    if (role === 'admin') {
      wx.reLaunch({ url: '/pages/admin-home/admin-home' })
      return
    }

    wx.reLaunch({ url: '/pages/gallery/gallery' })
  }
})
