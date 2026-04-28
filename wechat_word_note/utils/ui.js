// utils/ui.js
function showError(message, title = '提示') {
  wx.showModal({
    title,
    content: message,
    showCancel: false,
    confirmText: '知道了',
  })
}

function handleAsyncError(error, fallbackMessage = '操作失败，请稍后重试') {
  const message = error && error.message ? error.message : fallbackMessage
  wx.showToast({
    title: message.length > 18 ? message.slice(0, 18) : message,
    icon: 'none',
    duration: 2000,
  })
  console.error(message, error)
}

module.exports = {
  showError,
  handleAsyncError,
}
