# 开发规范快速参考 (Quick Reference)

**项目**: Qwerty Learner Mini Program  
**版本**: v1.0.1

---

## 🚀 快速开始

### 必读文档
1. `AGENTS.md` - AI 代理开发指南
2. `doc/TECHNICAL_NOTES.md` - 详细技术说明
3. `doc/FIX_LOG.md` - 修复记录

### 开发环境
- **工具**: 微信开发者工具
- **版本**: SDK 3.14.1
- **语言**: JavaScript (ES6)
- **架构**: MVVM (Page-based)

---

## 📋 代码规范速查

### 1. 模块系统

```javascript
// ✅ 导出
module.exports = { functionName }

// ✅ 导入（必须带 .js）
const storage = require('../../utils/storage.js')

// ❌ 不要用 ES6
import/export
```

### 2. 命名规范

```javascript
// 变量/函数 - camelCase
const currentWord = 'apple'
function loadChapter() {}

// 常量 - UPPER_SNAKE_CASE
const DEFAULT_SETTINGS = {}
const KEYS = { SETTINGS: 'settings' }

// Page/Component - PascalCase
Page({})
Component({})
```

### 3. 格式化

```javascript
// 缩进: 2 空格
// 引号: 单引号 'string'
// 分号: 必须使用
// 行长: < 100 字符
```

### 4. 数据更新

```javascript
// ✅ 使用 setData
this.setData({
  currentWord: wordData
})

// ❌ 不要直接赋值
this.data.currentWord = wordData
```

### 5. 错误处理

```javascript
// Storage 操作必须 try-catch
try {
  wx.getStorageSync(key)
} catch (e) {
  console.error('错误:', e)
  return DEFAULT_VALUE
}

// 异步操作使用 Promise
function playAudio(word) {
  return new Promise((resolve, reject) => {
    // ...
  })
}
```

---

## ⚠️ 常见错误

### 1. JSON 文件问题

```javascript
// ❌ 错误 - 不能直接 require JSON
const data = require('./data.json')

// ✅ 正确 - 转换为 JS 模块
// data.js:
module.exports = [...]

// 导入:
const data = require('./data.js')
```

### 2. WXML 标签

```xml
<!-- ❌ 标签不匹配 -->
<view>
  <text>Hello</view>
</text>

<!-- ✅ 正确闭合 -->
<view>
  <text>Hello</text>
</view>
```

### 3. this 作用域

```javascript
// ❌ this 丢失
setTimeout(function() {
  this.setData({...})
}, 1000)

// ✅ 使用箭头函数
setTimeout(() => {
  this.setData({...})
}, 1000)
```

### 4. 资源清理

```javascript
// ✅ 必须在 onUnload 清理
onUnload() {
  if (this.audioCtx) {
    this.audioCtx.destroy()
  }
}
```

---

## 🔧 调试方法

### Console
```javascript
console.log('日志', data)
console.error('错误', error)
console.time('性能测试')
console.timeEnd('性能测试')
```

### DevTools
```
- Console: 查看日志
- Storage: 查看本地数据
- Network: 查看网络请求
- Wxml: 查看 DOM 结构
```

### 快捷键
```
Ctrl/Cmd + R - 重新加载
Ctrl/Cmd + S - 保存并编译
```

---

## 📁 项目结构

```
qwerty-learner-mini/
├── pages/          # 页面（4个）
│   ├── typing/     # 打字练习
│   ├── gallery/    # 词典选择
│   ├── errors/     # 错题本
│   └── add-dict/   # 添加词典
├── utils/          # 工具模块
│   ├── storage.js  # 本地存储
│   ├── audio.js    # 音频播放
│   └── dict.js     # 词典处理
├── data/           # 数据文件
│   ├── cet4.js     # CET4 词典（使用）
│   ├── cet4.json   # CET4 源数据
│   ├── cet6.js     # CET6 词典（使用）
│   └── cet6.json   # CET6 源数据
└── doc/            # 文档
    ├── FIX_LOG.md
    ├── TECHNICAL_NOTES.md
    └── QUICK_REFERENCE.md
```

---

## 🎯 关键 API

### WeChat Storage

```javascript
// 同步
wx.getStorageSync(key)
wx.setStorageSync(key, data)
wx.removeStorageSync(key)

// 异步
wx.getStorage({ key, success, fail })
wx.setStorage({ key, data })
```

### WeChat UI

```javascript
// Toast 提示
wx.showToast({ title: '提示', icon: 'none' })

// Modal 对话框
wx.showModal({ title: '标题', content: '内容' })

// 震动
wx.vibrateShort({ type: 'medium' })
```

### WeChat Navigation

```javascript
// 跳转
wx.navigateTo({ url: '/pages/gallery/gallery' })

// 重定向
wx.redirectTo({ url: '/pages/typing/typing' })

// 返回
wx.navigateBack()
```

---

## 📊 数据格式

### 单词对象
```json
{
  "name": "apple",
  "trans": ["n. 苹果"],
  "usphone": "ˈæpl",
  "ukphone": "ˈæpl"
}
```

### 存储键值
```javascript
settings        // 用户设置
custom_dicts    // 自定义词典
error_words     // 错题记录
progress        // 学习进度
```

---

## ✅ 检查清单

### 编写代码前
- [ ] 阅读相关代码示例
- [ ] 确认使用 CommonJS 语法
- [ ] 检查 require 路径带 .js

### 编写代码后
- [ ] 所有异步操作有错误处理
- [ ] Storage 操作用 try-catch
- [ ] 资源在 onUnload 清理
- [ ] WXML 标签正确闭合

### 提交前
- [ ] 在模拟器测试
- [ ] 在真机测试
- [ ] 检查 Console 无错误
- [ ] 更新相关文档

---

## 🔗 相关资源

### 官方文档
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信 API 文档](https://developers.weixin.qq.com/miniprogram/dev/api/)

### 项目文档
- `README.md` - 完整说明
- `QUICK_START.md` - 快速开始
- `PROJECT_SUMMARY.md` - 项目总结
- `AGENTS.md` - 开发指南

---

## 💡 最佳实践

### 1. 性能
- 批量更新 setData
- 使用懒加载
- 及时清理资源

### 2. 代码质量
- 函数保持简短（< 50 行）
- 使用描述性命名
- 添加适当注释

### 3. 用户体验
- 提供加载状态
- 错误友好提示
- 操作及时反馈

### 4. 数据安全
- 验证输入数据
- 处理边界情况
- 优雅降级处理

---

**创建日期**: 2026-01-29  
**维护者**: AI Coding Agents  
**版本**: 1.0.0
