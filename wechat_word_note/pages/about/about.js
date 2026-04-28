// pages/about/about.js
Page({
  copyText(e) {
    const text = e.currentTarget.dataset.text
    const type = e.currentTarget.dataset.type
    
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: `${type}已复制`,
          icon: 'success'
        })
      }
    })
  }
})
