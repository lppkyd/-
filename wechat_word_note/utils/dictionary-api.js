// utils/dictionary-api.js
// 有道词典API封装

const API_BASE = 'https://dict.youdao.com/suggest'

/**
 * 查询单词释义（使用有道词典免费Suggest API）
 * @param {string} word - 要查询的单词
 * @returns {Promise<Object>} 返回格式化的单词对象
 * 
 * 返回格式：
 * {
 *   name: "apple",
 *   trans: ["n. 苹果"],
 *   usphone: "",
 *   ukphone: ""
 * }
 */
function queryWord(word) {
  return new Promise((resolve, reject) => {
    if (!word || !word.trim()) {
      reject(new Error('单词不能为空'))
      return
    }

    const trimmedWord = word.trim().toLowerCase()
    
    wx.request({
      url: API_BASE,
      data: {
        q: trimmedWord,
        num: 1,
        doctype: 'json'
      },
      method: 'GET',
      timeout: 5000, // 5秒超时
      success: (res) => {
        console.log('API响应:', res)
        
        if (res.statusCode === 200 && res.data.result && res.data.result.code === 200) {
          const entries = res.data.data.entries
          
          if (entries && entries.length > 0) {
            const entry = entries[0]
            
            // 转换为项目所需格式
            const wordObj = {
              name: entry.entry || trimmedWord,
              trans: [entry.explain || ''],
              usphone: '', // suggest API不提供音标，未来可以升级到付费API
              ukphone: ''
            }
            
            console.log('查询成功:', wordObj)
            resolve(wordObj)
          } else {
            console.warn('未找到释义')
            reject(new Error('未找到释义'))
          }
        } else {
          console.error('API返回错误:', res)
          reject(new Error('查询失败'))
        }
      },
      fail: (err) => {
        console.error('API请求失败:', err)
        
        // 根据错误类型返回更具体的错误信息
        if (err.errMsg && err.errMsg.includes('timeout')) {
          reject(new Error('请求超时，请检查网络'))
        } else if (err.errMsg && err.errMsg.includes('fail')) {
          reject(new Error('网络错误，请稍后重试'))
        } else {
          reject(new Error('查询失败'))
        }
      }
    })
  })
}

/**
 * 批量查询单词（未来扩展）
 * @param {Array<string>} words - 单词数组
 * @returns {Promise<Array<Object>>} 返回单词对象数组
 */
function queryWords(words) {
  return Promise.all(words.map(word => queryWord(word)))
}

module.exports = {
  queryWord,
  queryWords
}
