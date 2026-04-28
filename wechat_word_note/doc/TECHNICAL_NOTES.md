# 技术要点 - 微信小程序开发 (Technical Notes)

**项目**: Qwerty Learner Mini Program  
**日期**: 2026-01-29

---

## 1. 模块系统 (Module System)

### CommonJS vs ES Modules

微信小程序**只支持 CommonJS**，不支持 ES6 模块语法。

#### ✅ 正确写法
```javascript
// 导出
module.exports = {
  functionName,
  variableName
}

// 或单个导出
module.exports = functionName

// 导入
const storage = require('../../utils/storage.js')
const { functionName } = require('./module.js')
```

#### ❌ 错误写法
```javascript
// ❌ 不支持 ES6 export
export default { ... }
export const functionName = () => {}

// ❌ 不支持 ES6 import
import storage from '../../utils/storage.js'
import { functionName } from './module.js'
```

### 文件扩展名

**必须**在 `require()` 中包含 `.js` 扩展名：

```javascript
// ✅ 推荐
const audio = require('../../utils/audio.js')

// ⚠️ 可能在某些版本工作，但不推荐
const audio = require('../../utils/audio')
```

---

## 2. JSON 数据处理

### 问题：不能直接 require JSON

微信小程序**不支持**直接 `require()` JSON 文件：

```javascript
// ❌ 这会报错
const data = require('./data.json')
// Error: module 'data.json.js' is not defined
```

### 解决方案：转换为 JS 模块

#### 方法 1: 手动转换
```javascript
// data.js
module.exports = [
  { "name": "apple", "trans": ["n. 苹果"] },
  { "name": "banana", "trans": ["n. 香蕉"] }
]

// 使用
const data = require('./data.js')
```

#### 方法 2: 自动转换脚本
```bash
# 将 JSON 转换为 JS 模块
cat data.json | sed '1s/^/module.exports = /' > data.js
```

#### 文件组织建议
```
data/
├── cet4.json  # 源数据（便于编辑）
├── cet4.js    # 程序使用（module.exports 包装）
├── cet6.json  # 源数据
└── cet6.js    # 程序使用
```

---

## 3. 页面架构 (Page Architecture)

### Page 生命周期

```javascript
Page({
  data: {
    // 页面初始数据
    message: 'Hello'
  },

  // 生命周期函数
  onLoad(options) {
    // 页面加载时触发，只触发一次
    // 适合：初始化数据、加载配置
  },

  onShow() {
    // 页面显示/切入前台时触发
    // 适合：刷新数据、恢复状态
  },

  onReady() {
    // 页面首次渲染完成时触发，只触发一次
    // 适合：获取节点信息、设置动画
  },

  onHide() {
    // 页面隐藏/切入后台时触发
    // 适合：暂停音频、保存草稿
  },

  onUnload() {
    // 页面卸载时触发
    // 适合：清理资源、销毁定时器、关闭音频
  },

  // 自定义方法
  customMethod() {
    // 使用 this.setData 更新数据
    this.setData({
      message: 'Updated'
    })
  }
})
```

### setData 使用规范

#### ✅ 正确用法
```javascript
// 1. 更新单个字段
this.setData({
  currentWord: wordData
})

// 2. 更新多个字段
this.setData({
  currentWord: wordData,
  inputValue: '',
  correctCount: 0
})

// 3. 更新数组元素
this.setData({
  'array[0]': newValue,
  'object.field': newValue
})
```

#### ❌ 错误用法
```javascript
// ❌ 直接赋值不会触发视图更新
this.data.currentWord = wordData

// ❌ 频繁调用 setData 会导致性能问题
for (let i = 0; i < 100; i++) {
  this.setData({ count: i })  // 每次都触发渲染
}

// ✅ 应该批量更新
let updates = {}
for (let i = 0; i < 100; i++) {
  updates[`items[${i}]`] = data[i]
}
this.setData(updates)  // 只触发一次渲染
```

---

## 4. 本地存储 (Local Storage)

### 同步 API vs 异步 API

```javascript
// ✅ 同步 API（推荐用于小数据）
try {
  const value = wx.getStorageSync('key')
  wx.setStorageSync('key', value)
  wx.removeStorageSync('key')
  wx.clearStorageSync()
} catch (e) {
  console.error('Storage error:', e)
}

// 异步 API（用于大数据或性能敏感场景）
wx.getStorage({
  key: 'key',
  success: (res) => {
    console.log(res.data)
  },
  fail: (err) => {
    console.error(err)
  }
})
```

### 存储限制
- **单个 key 大小**: 1MB
- **总存储空间**: 10MB
- **超限处理**: 会触发错误回调

### 最佳实践
```javascript
// 1. 始终使用 try-catch
function getSettings() {
  try {
    const settings = wx.getStorageSync('settings')
    return settings || DEFAULT_SETTINGS
  } catch (e) {
    console.error('读取设置失败:', e)
    return DEFAULT_SETTINGS
  }
}

// 2. 数据验证
function saveSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    console.error('Invalid settings')
    return false
  }
  try {
    wx.setStorageSync('settings', settings)
    return true
  } catch (e) {
    console.error('保存设置失败:', e)
    return false
  }
}
```

---

## 5. 异步处理 (Async Handling)

### Promise 封装

```javascript
// 封装微信 API 为 Promise
function playPronunciation(word, type = 'us') {
  return new Promise((resolve, reject) => {
    if (!word) {
      reject(new Error('单词不能为空'))
      return
    }

    const audio = wx.createInnerAudioContext()
    audio.src = `https://api.example.com/audio?word=${word}`

    audio.onEnded(() => resolve())
    audio.onError((res) => reject(res))

    audio.play()
  })
}

// 使用
playPronunciation('apple')
  .then(() => console.log('播放完成'))
  .catch((err) => console.error('播放失败:', err))
```

### async/await 用法

```javascript
Page({
  async loadData() {
    try {
      // 并行加载
      const [userData, dictData] = await Promise.all([
        this.fetchUserData(),
        this.fetchDictData()
      ])

      this.setData({
        user: userData,
        dict: dictData
      })
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  }
})
```

---

## 6. 错误处理 (Error Handling)

### 分层错误处理

```javascript
// 1. 底层工具函数 - 抛出错误
function getStorageData(key) {
  try {
    const data = wx.getStorageSync(key)
    if (!data) {
      throw new Error(`No data found for key: ${key}`)
    }
    return data
  } catch (e) {
    throw new Error(`Storage read failed: ${e.message}`)
  }
}

// 2. 业务逻辑层 - 处理错误
function loadUserSettings() {
  try {
    return getStorageData('settings')
  } catch (e) {
    console.error('加载设置失败:', e)
    return DEFAULT_SETTINGS
  }
}

// 3. 页面层 - 用户反馈
Page({
  onLoad() {
    try {
      const settings = loadUserSettings()
      this.setData({ settings })
    } catch (e) {
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    }
  }
})
```

---

## 7. 性能优化 (Performance)

### 1. setData 优化

```javascript
// ❌ 频繁调用
for (let i = 0; i < words.length; i++) {
  this.setData({
    [`words[${i}]`]: words[i]
  })
}

// ✅ 批量更新
this.setData({
  words: words
})
```

### 2. 数据懒加载

```javascript
// ❌ 一次性加载所有数据
const allWords = require('../data/all-words.js')  // 10MB

// ✅ 按需加载章节
function loadChapter(chapter) {
  const start = chapter * 200
  const end = start + 200
  return allWords.slice(start, end)
}
```

### 3. 图片优化

```xml
<!-- 使用 lazy-load 延迟加载 -->
<image 
  src="{{imageUrl}}" 
  mode="aspectFill"
  lazy-load="{{true}}"
/>

<!-- 使用 WebP 格式 -->
<image src="/images/icon.webp" />
```

---

## 8. WXML 模板最佳实践

### 条件渲染

```xml
<!-- wx:if vs hidden -->

<!-- wx:if - 惰性渲染，条件为 false 时不渲染 -->
<view wx:if="{{condition}}">
  <!-- 条件为 true 时才创建节点 -->
</view>

<!-- hidden - 始终渲染，只是隐藏 -->
<view hidden="{{!condition}}">
  <!-- 节点始终存在，通过 display:none 隐藏 -->
</view>

<!-- 使用场景 -->
<!-- 1. 频繁切换 → 使用 hidden -->
<!-- 2. 运行时条件很少改变 → 使用 wx:if -->
```

### 列表渲染

```xml
<!-- 必须指定 wx:key -->
<view 
  wx:for="{{items}}" 
  wx:key="id"
  wx:for-item="item"
  wx:for-index="idx"
>
  {{idx}}: {{item.name}}
</view>

<!-- 嵌套循环 -->
<view wx:for="{{groups}}" wx:key="groupId" wx:for-item="group">
  <view wx:for="{{group.items}}" wx:key="itemId" wx:for-item="item">
    {{item.name}}
  </view>
</view>
```

### 事件绑定

```xml
<!-- bind - 冒泡事件 -->
<view bindtap="handleTap">Click me</view>

<!-- catch - 阻止冒泡 -->
<view catchtap="handleTap">Click me</view>

<!-- 传递参数 -->
<view 
  bindtap="handleTap" 
  data-id="{{item.id}}"
  data-name="{{item.name}}"
>
  Click
</view>
```

```javascript
// 获取参数
handleTap(e) {
  const { id, name } = e.currentTarget.dataset
  console.log(id, name)
}
```

---

## 9. 网络请求

### 配置域名白名单

```json
// project.config.json
{
  "setting": {
    "urlCheck": false  // 开发阶段可关闭
  }
}
```

### 请求封装

```javascript
function request(url, data = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      data: data,
      method: method,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`Request failed: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 使用
async fetchData() {
  try {
    const data = await request('https://api.example.com/data')
    this.setData({ data })
  } catch (error) {
    console.error('Request failed:', error)
  }
}
```

---

## 10. 调试技巧

### Console 调试

```javascript
// 1. 基础日志
console.log('普通日志', data)
console.info('信息日志', data)
console.warn('警告日志', data)
console.error('错误日志', data)

// 2. 分组日志
console.group('数据加载')
console.log('开始加载')
console.log('数据:', data)
console.groupEnd()

// 3. 性能测试
console.time('加载时间')
// 执行代码
console.timeEnd('加载时间')
```

### Storage 查看

```
微信开发者工具 → 调试器 → Storage
- 查看所有存储数据
- 手动添加/删除/修改
- 清空全部数据
```

### Network 监控

```
微信开发者工具 → 调试器 → Network
- 查看所有网络请求
- 检查请求参数
- 查看响应数据
```

---

## 11. 常见陷阱

### 1. 异步陷阱

```javascript
// ❌ 错误 - setData 后立即读取
this.setData({ count: 10 })
console.log(this.data.count)  // 可能是旧值

// ✅ 正确 - 使用回调
this.setData({ count: 10 }, () => {
  console.log(this.data.count)  // 新值
})
```

### 2. 作用域陷阱

```javascript
// ❌ 错误 - this 指向丢失
setTimeout(function() {
  this.setData({ message: 'Hello' })  // this 不是 Page
}, 1000)

// ✅ 正确 - 使用箭头函数
setTimeout(() => {
  this.setData({ message: 'Hello' })
}, 1000)

// ✅ 正确 - 保存 this
const that = this
setTimeout(function() {
  that.setData({ message: 'Hello' })
}, 1000)
```

### 3. 资源清理

```javascript
Page({
  onLoad() {
    this.audioCtx = wx.createInnerAudioContext()
  },

  // ❌ 忘记清理
  onUnload() {
    // 内存泄漏！
  },

  // ✅ 正确清理
  onUnload() {
    if (this.audioCtx) {
      this.audioCtx.destroy()
      this.audioCtx = null
    }
  }
})
```

---

## 12. 项目特定要点

### 词典数据结构

```javascript
// 单词对象格式
{
  "name": "apple",           // 单词
  "trans": ["n. 苹果"],      // 翻译（数组）
  "usphone": "ˈæpl",         // 美式音标
  "ukphone": "ˈæpl"          // 英式音标
}
```

### 音频播放

```javascript
// 有道词典 API
const url = `https://dict.youdao.com/dictvoice?audio=${word}&type=${type}`
// type: 1=英音, 2=美音
```

### 存储键值

```javascript
const KEYS = {
  SETTINGS: 'settings',          // 用户设置
  CUSTOM_DICTS: 'custom_dicts',  // 自定义词典
  ERROR_WORDS: 'error_words',    // 错题本
  PROGRESS: 'progress'           // 学习进度
}
```

---

**最后更新**: 2026-01-29  
**维护者**: AI Coding Agents
