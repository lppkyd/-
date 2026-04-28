// utils/audio.js
// 音频播放封装

let audioContext = null

// 初始化音频上下文
function initAudio() {
  if (!audioContext) {
    audioContext = wx.createInnerAudioContext()
    audioContext.autoplay = false
  }
  return audioContext
}

// 播放单词发音
function playPronunciation(word, type = 'us') {
  return new Promise((resolve, reject) => {
    if (!word) {
      reject(new Error('单词不能为空'))
      return
    }

    const audio = initAudio()
    const typeCode = type === 'uk' ? 1 : 2
    audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${typeCode}`

    audio.onPlay(() => {
      console.log('开始播放:', word)
    })

    audio.onEnded(() => {
      console.log('播放完成:', word)
      resolve()
    })

    audio.onError((res) => {
      console.error('播放失败:', res)
      reject(res)
    })

    audio.play()
  })
}

// 停止播放
function stopPronunciation() {
  if (audioContext) {
    audioContext.stop()
  }
}

// 销毁音频上下文
function destroyAudio() {
  if (audioContext) {
    audioContext.destroy()
    audioContext = null
  }
}

module.exports = {
  playPronunciation,
  stopPronunciation,
  destroyAudio,
}
