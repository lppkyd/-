# 未来优化方案 - Qwerty Learner 小程序

本文档记录了小程序的未来功能扩展和优化方向，包括付费API集成、用户体验提升等计划。

---

## 📅 更新日期

**创建时间**: 2026-01-30  
**最后更新**: 2026-01-30

---

## 🎯 已实现功能（v1.0）

### 1. 输入体验优化
- ✅ **输入框光标左对齐**：typing 页面输入框改为左对齐，类似搜索框体验
- ✅ **单词显示区域优化**：保持渐变背景风格，明确区分展示和输入区域

### 2. 查词功能（免费版）
- ✅ **有道词典免费API集成**
  - 使用 `https://dict.youdao.com/suggest` 接口
  - 无需密钥，即时可用
  - 返回基本释义
  - 封装于 `utils/dictionary-api.js`
- ✅ **add-word 页面查词按钮**
  - 手动点击触发查询
  - 自动填充释义
  - 查询状态提示
  - 错误处理友好

**技术实现**:
```
文件变更:
- utils/dictionary-api.js (新增, 95行)
- pages/typing/typing.wxss (修改, 1处)
- pages/add-word/add-word.wxml (修改, +20行)
- pages/add-word/add-word.js (修改, +60行)
- pages/add-word/add-word.wxss (修改, +35行)
```

---

## 🚀 未来优化方向

### A. 付费API升级计划

#### A1. 有道翻译官方API集成（高优先级）

**目标**: 获取更稳定、更丰富的词典数据

**官方文档**: https://ai.youdao.com/doc.s#guide

**优势**:
- ✨ **稳定性高**: 官方保证的服务可用性
- ✨ **数据丰富**: 音标、例句、词根词缀、同义词等
- ✨ **免费额度**: 每天100万字符免费
- ✨ **调用限制**: QPS更高，适合批量查询

**申请步骤**:
1. 注册有道智云账号: https://ai.youdao.com/
2. 创建应用获取 APP ID 和密钥
3. 阅读API文档: https://ai.youdao.com/docs/doc-trans-api.s#p02
4. 配置小程序域名白名单（可能需要备案）

**技术实现**:

1. **创建配置文件** `config/api-keys.js`:
```javascript
// config/api-keys.js
module.exports = {
  YOUDAO: {
    APP_ID: 'YOUR_APP_ID',      // 从有道智云获取
    APP_SECRET: 'YOUR_SECRET',   // 从有道智云获取
    API_URL: 'https://openapi.youdao.com/api'
  }
}
```

2. **升级 `utils/dictionary-api.js`**:
```javascript
// 添加签名生成函数
function generateSign(appId, secret, q, salt, curtime) {
  const str = appId + truncate(q) + salt + curtime + secret
  return CryptoJS.SHA256(str).toString()
}

// 新增高级查询函数
function queryWordAdvanced(word) {
  const appId = config.YOUDAO.APP_ID
  const secret = config.YOUDAO.APP_SECRET
  const salt = Date.now()
  const curtime = Math.round(Date.now() / 1000)
  const sign = generateSign(appId, secret, word, salt, curtime)
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.YOUDAO.API_URL,
      data: {
        q: word,
        from: 'auto',
        to: 'zh-CHS',
        appKey: appId,
        salt: salt,
        sign: sign,
        signType: 'v3',
        curtime: curtime
      },
      success: (res) => {
        // 解析返回数据
        const data = res.data
        const wordObj = {
          name: word,
          trans: data.translation || [],
          usphone: data.basic?.['us-phonetic'] || '',
          ukphone: data.basic?.['uk-phonetic'] || '',
          explains: data.basic?.explains || [],
          webTrans: data.web || []
        }
        resolve(wordObj)
      },
      fail: reject
    })
  })
}
```

3. **优化查词体验**:
   - 添加音标显示区域
   - 显示多个释义选项
   - 添加例句展示
   - 支持网络释义

**返回数据示例**:
```json
{
  "translation": ["苹果"],
  "basic": {
    "us-phonetic": "ˈæpl",
    "uk-phonetic": "ˈæpl",
    "phonetic": "ˈæpl",
    "explains": [
      "n. 苹果；苹果公司；苹果树"
    ]
  },
  "web": [
    {
      "key": "Apple",
      "value": ["苹果", "苹果公司", "苹果电脑"]
    }
  ]
}
```

**预计工作量**: 2-3小时
**优先级**: ⭐⭐⭐⭐⭐

---

#### A2. 其他词典API备选方案

##### 选项1: 金山词霸API
- **特点**: 免费，数据较简单
- **接口**: http://dict-co.iciba.com/api/dictionary.php
- **适用场景**: 备用方案

##### 选项2: 欧路词典API
- **特点**: 数据详尽，需付费
- **接口**: 需申请
- **适用场景**: 高级用户功能

---

### B. 用户体验优化

#### B1. 查词历史记录（中优先级）

**功能描述**:
- 记录用户查询过的单词
- 支持历史记录查看和复用
- 一键添加到生词本

**技术实现**:
```javascript
// utils/storage.js 新增
const KEYS = {
  // ... 现有键
  LOOKUP_HISTORY: 'lookup_history'
}

function addLookupHistory(wordObj) {
  try {
    let history = wx.getStorageSync(KEYS.LOOKUP_HISTORY) || []
    
    // 去重：如果已存在，移到最前面
    history = history.filter(item => item.name !== wordObj.name)
    history.unshift({
      ...wordObj,
      timestamp: Date.now()
    })
    
    // 限制历史记录数量（最多100条）
    if (history.length > 100) {
      history = history.slice(0, 100)
    }
    
    wx.setStorageSync(KEYS.LOOKUP_HISTORY, history)
    return true
  } catch (e) {
    console.error('保存查询历史失败:', e)
    return false
  }
}
```

**UI改进**:
- 在 add-word 页面添加"历史"按钮
- 点击展开历史记录面板
- 点击历史项快速填充

**预计工作量**: 1.5小时
**优先级**: ⭐⭐⭐⭐

---

#### B2. 查询结果缓存（中优先级）

**功能描述**:
- 缓存已查询的单词释义
- 减少重复API调用
- 节省流量和时间

**技术实现**:
```javascript
// utils/dictionary-api.js
const CACHE_KEY = 'dict_cache'
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000 // 7天

function getCachedWord(word) {
  try {
    const cache = wx.getStorageSync(CACHE_KEY) || {}
    const item = cache[word.toLowerCase()]
    
    if (item && (Date.now() - item.timestamp) < CACHE_EXPIRE) {
      return item.data
    }
    return null
  } catch (e) {
    return null
  }
}

function setCachedWord(word, data) {
  try {
    const cache = wx.getStorageSync(CACHE_KEY) || {}
    cache[word.toLowerCase()] = {
      data: data,
      timestamp: Date.now()
    }
    wx.setStorageSync(CACHE_KEY, cache)
  } catch (e) {
    console.error('缓存失败:', e)
  }
}

// 修改 queryWord 函数
function queryWord(word) {
  // 先检查缓存
  const cached = getCachedWord(word)
  if (cached) {
    console.log('使用缓存数据:', word)
    return Promise.resolve(cached)
  }
  
  // 缓存未命中，调用API
  return new Promise((resolve, reject) => {
    // ... API调用逻辑
    // 成功后存入缓存
    setCachedWord(word, wordObj)
    resolve(wordObj)
  })
}
```

**预计工作量**: 1小时
**优先级**: ⭐⭐⭐⭐

---

#### B3. 批量导入单词（低优先级）

**功能描述**:
- 支持从文本粘贴多个单词
- 自动批量查询释义
- 批量添加到生词本

**技术实现**:
- 新增 `pages/batch-import/` 页面
- 使用 textarea 输入多行单词
- 使用 `Promise.all()` 批量查询
- 显示查询进度条

**注意事项**:
- 需控制并发数量（建议每次5个）
- 避免触发API限流
- 提供失败重试机制

**预计工作量**: 3小时
**优先级**: ⭐⭐

---

### C. 功能扩展

#### C1. 练习页面集成查词（高优先级）

**功能描述**:
- 在 typing 页面长按单词显示菜单
- 菜单选项：查看详细释义、添加到生词本、跳过
- 弹出详细释义对话框（包含音标、例句等）

**技术实现**:
```xml
<!-- pages/typing/typing.wxml -->
<view class="word-display" bindlongpress="onWordLongPress">
  <text class="word-text">{{displayWord}}</text>
  ...
</view>

<!-- 详细释义弹窗 -->
<view class="word-detail-modal" wx:if="{{showDetailModal}}">
  <view class="modal-content">
    <text class="modal-word">{{currentWord.name}}</text>
    <text class="modal-phonetic">{{currentWord.usphone}}</text>
    <view class="modal-trans">
      <text wx:for="{{currentWord.trans}}" wx:key="*this">{{item}}</text>
    </view>
    <button bindtap="addToVocabulary">添加到生词本</button>
    <button bindtap="closeModal">关闭</button>
  </view>
</view>
```

**预计工作量**: 2小时
**优先级**: ⭐⭐⭐⭐⭐

---

#### C2. 独立查词页面（中优先级）

**功能描述**:
- 新增专门的查词页面
- 功能丰富：查词、历史记录、收藏夹
- 支持中英互译
- 支持例句查看

**页面结构**:
```
pages/dictionary/
├── dictionary.wxml
├── dictionary.js
├── dictionary.wxss
└── dictionary.json
```

**功能模块**:
1. 搜索栏（支持语音输入）
2. 查询结果区（详细释义、音标、例句）
3. 历史记录区（可清空）
4. 收藏夹区（星标重要单词）
5. 相关推荐（同义词、反义词）

**预计工作量**: 5小时
**优先级**: ⭐⭐⭐

---

#### C3. 离线词典包（低优先级）

**功能描述**:
- 预置常用单词词典（如CET4/6核心词汇）
- 离线情况下可查询基本释义
- 减少网络依赖

**技术实现**:
```javascript
// data/offline-dict.js
const OFFLINE_DICT = {
  'apple': {
    trans: ['n. 苹果'],
    usphone: 'ˈæpl',
    ukphone: 'ˈæpl'
  },
  // ... 3000+ 常用单词
}

module.exports = OFFLINE_DICT
```

**注意事项**:
- 词典文件体积控制（建议 < 500KB）
- 使用压缩技术（如仅存核心释义）
- 提供在线更新机制

**预计工作量**: 4小时
**优先级**: ⭐⭐

---

### D. 性能优化

#### D1. 图片懒加载（中优先级）

**适用场景**:
- 词典列表页面
- 例句图片展示

**技术实现**:
```xml
<image lazy-load="{{true}}" src="{{imageUrl}}" />
```

**预计工作量**: 0.5小时
**优先级**: ⭐⭐⭐

---

#### D2. 分包加载优化（低优先级）

**功能描述**:
- 将非核心功能分包
- 减少主包体积
- 提升首次加载速度

**分包策略**:
```json
{
  "subpackages": [
    {
      "root": "pages/advanced/",
      "pages": [
        "dictionary/dictionary",
        "batch-import/batch-import"
      ]
    }
  ]
}
```

**预计工作量**: 1小时
**优先级**: ⭐⭐

---

### E. 数据统计与分析

#### E1. 用户学习统计（中优先级）

**功能描述**:
- 统计每日查词次数
- 统计添加单词数量
- 生成学习报告

**技术实现**:
```javascript
// utils/statistics.js
function recordLookup(word) {
  const today = new Date().toDateString()
  const stats = wx.getStorageSync('daily_stats') || {}
  
  if (!stats[today]) {
    stats[today] = { lookups: 0, additions: 0 }
  }
  
  stats[today].lookups++
  wx.setStorageSync('daily_stats', stats)
}
```

**UI展示**:
- 在用户中心显示统计图表
- 每周/每月学习总结

**预计工作量**: 3小时
**优先级**: ⭐⭐⭐

---

## 🛠️ 技术债务

### 1. 错误处理增强
- [ ] 统一错误码定义
- [ ] 友好的错误提示文案
- [ ] 网络错误重试机制

### 2. 代码优化
- [ ] 提取公共样式到 app.wxss
- [ ] 封装公共组件（如 Toast、Modal）
- [ ] 添加代码注释和 JSDoc

### 3. 测试覆盖
- [ ] 编写单元测试（查词API、存储模块）
- [ ] 真机兼容性测试
- [ ] 网络弱环境测试

---

## 📊 优先级总结

### 第一批（1-2周）
1. ⭐⭐⭐⭐⭐ 有道翻译官方API集成
2. ⭐⭐⭐⭐⭐ 练习页面集成查词
3. ⭐⭐⭐⭐ 查询结果缓存
4. ⭐⭐⭐⭐ 查词历史记录

### 第二批（3-4周）
1. ⭐⭐⭐ 独立查词页面
2. ⭐⭐⭐ 用户学习统计
3. ⭐⭐⭐ 图片懒加载

### 第三批（长期）
1. ⭐⭐ 批量导入单词
2. ⭐⭐ 离线词典包
3. ⭐⭐ 分包加载优化

---

## 📝 开发备注

### 配置要求
- 微信开发者工具版本: >= 1.06
- 小程序基础库: >= 2.10.0
- Node.js 版本: >= 14.0（如需本地构建）

### 域名配置
需要在小程序管理后台配置以下合法域名：

**request 合法域名**:
- `https://dict.youdao.com` （已配置，用于免费API）
- `https://openapi.youdao.com` （待配置，用于付费API）

**注意**: 有道官方API可能需要服务器域名备案

### 第三方依赖
- 无外部依赖（纯原生微信小程序）
- 如需加密算法（签名生成），可引入 `crypto-js`

---

## 🤝 贡献指南

如需实施以上功能，建议遵循以下流程：

1. **需求确认**: 与产品/用户确认功能细节
2. **技术调研**: 验证API可用性，评估技术可行性
3. **原型设计**: 绘制UI原型，确认交互流程
4. **编码实现**: 遵循现有代码规范（见 AGENTS.md）
5. **测试验证**: 模拟器 + 真机测试
6. **文档更新**: 更新 README.md 和本文档

---

## 📞 联系方式

如有疑问或建议，请通过以下方式反馈：
- 项目 Issue
- 代码审查评论
- 团队沟通渠道

---

**文档维护者**: AI Coding Agent  
**最后更新**: 2026-01-30
