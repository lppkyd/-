// pages/add-dict/add-dict.js
const storage = require('../../utils/storage.js')

Page({
  data: {
    dictName: '',
    wordsText: '',
    exampleText: 'apple\nn. 苹果\n\nbanana\nn. 香蕉\n\norange\nn. 橙子',
  },

  // 输入词典名称
  onNameInput(e) {
    this.setData({
      dictName: e.detail.value,
    })
  },

  // 输入单词列表
  onWordsInput(e) {
    this.setData({
      wordsText: e.detail.value,
    })
  },

  // 查看示例
  showExample() {
    wx.showModal({
      title: '格式说明',
      content: '每个单词占3行：\n第1行：单词\n第2行：释义\n第3行：空行\n\n例如：\napple\nn. 苹果\n\nbanana\nn. 香蕉',
      showCancel: false,
    })
  },

  // 解析单词文本
  parseWords(text) {
    const lines = text
      .trim()
      .split('\n')
      .filter((line) => line.trim())
    const words = []

    for (let i = 0; i < lines.length; i += 2) {
      const name = lines[i].trim()
      const trans = lines[i + 1] ? [lines[i + 1].trim()] : ['']

      if (name) {
        words.push({
          name: name,
          trans: trans,
          usphone: '',
          ukphone: '',
        })
      }
    }

    return words
  },

  // 保存词典
  saveDict() {
    const { dictName, wordsText } = this.data

    // 验证
    if (!dictName.trim()) {
      wx.showToast({
        title: '请输入词典名称',
        icon: 'none',
      })
      return
    }

    if (!wordsText.trim()) {
      wx.showToast({
        title: '请输入单词列表',
        icon: 'none',
      })
      return
    }

    // 解析单词
    const words = this.parseWords(wordsText)

    if (words.length === 0) {
      wx.showToast({
        title: '未识别到有效单词',
        icon: 'none',
      })
      return
    }

    // 保存
    const dict = storage.addCustomDict({
      name: dictName,
      words: words,
    })

    if (dict) {
      wx.showToast({
        title: '添加成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        },
      })
    } else {
      wx.showToast({
        title: '添加失败',
        icon: 'none',
      })
    }
  },

  // 导入示例
  importExample() {
    this.setData({
      wordsText: this.data.exampleText,
    })

    wx.showToast({
      title: '已导入示例',
      icon: 'success',
    })
  },
})
