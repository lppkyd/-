# 自定义词典加载问题修复记录

**日期**: 2026-01-29  
**问题编号**: #002  
**修复人**: AI Agent (Antigravity Claude)

---

## 问题描述

### 症状
当用户在词典页面添加自定义词典并选择该词典后，打字练习页面显示"章节加载失败"错误，无法正常使用自定义词典进行练习。

### 用户操作流程
1. 用户点击词典页面的"+ 添加"按钮
2. 输入词典名称和单词列表
3. 点击"保存词典"
4. 选择新创建的自定义词典
5. 跳转到打字练习页面
6. **问题**: 显示"章节加载失败"提示

### 错误日志
```
Console: Dictionary not found: custom_1738166400000
Console: Dictionary info not found: custom_1738166400000
Toast: 章节加载失败
```

---

## 根本原因分析

### 1. 架构问题

**`utils/dict.js`** 模块设计为只处理预设词典（CET4、CET6）：

```javascript
// 原代码 - 只有预设词典
const DICT_INFO = {
  cet4: { ... },
  cet6: { ... }
}

function getDictInfo(dictId) {
  return DICT_INFO[dictId] || null  // ❌ 自定义词典返回 null
}

function getDictData(dictId) {
  switch (dictId) {
    case 'cet4': return CET4_DATA
    case 'cet6': return CET6_DATA
    default: return null  // ❌ 自定义词典返回 null
  }
}
```

### 2. 数据流程

```
用户添加自定义词典
    ↓
storage.addCustomDict() → 保存到 localStorage
    ↓
用户选择自定义词典
    ↓
storage.updateSettings({ currentDictId: 'custom_xxx' })
    ↓
typing 页面 loadChapter()
    ↓
dictUtil.getDictInfo('custom_xxx') → ❌ 返回 null
    ↓
dictUtil.getChapterWords('custom_xxx', 0) → ❌ 返回 []
    ↓
显示"章节加载失败"
```

### 3. 问题根源
- **dict.js** 没有访问 **storage.js** 的能力，无法读取自定义词典数据
- **getDictInfo()** 和 **getDictData()** 只处理硬编码的预设词典
- 缺少对 `custom_` 前缀词典 ID 的处理逻辑

---

## 解决方案

### 修改 1: 引入 storage 依赖

**文件**: `utils/dict.js`

```javascript
// 添加 storage 依赖
const storage = require('./storage.js')
```

**原因**: 需要访问 storage 来读取自定义词典数据

### 修改 2: 扩展 getDictInfo() 支持自定义词典

**修改前**:
```javascript
function getDictInfo(dictId) {
  return DICT_INFO[dictId] || null
}
```

**修改后**:
```javascript
function getDictInfo(dictId) {
  // 检查预设词典
  if (DICT_INFO[dictId]) {
    return DICT_INFO[dictId]
  }
  
  // 检查自定义词典
  if (dictId.startsWith('custom_')) {
    const customDicts = storage.getCustomDicts()
    const customDict = customDicts.find(d => d.id === dictId)
    
    if (customDict) {
      const totalWords = customDict.words.length
      const wordsPerChapter = 200
      
      return {
        id: customDict.id,
        name: customDict.name,
        description: '自定义词典',
        wordsPerChapter: wordsPerChapter,
        totalWords: totalWords,
        totalChapters: Math.ceil(totalWords / wordsPerChapter),
      }
    }
  }
  
  return null
}
```

### 修改 3: 扩展 getDictData() 支持自定义词典

**修改前**:
```javascript
function getDictData(dictId) {
  switch (dictId) {
    case 'cet4': return CET4_DATA
    case 'cet6': return CET6_DATA
    default: return null
  }
}
```

**修改后**:
```javascript
function getDictData(dictId) {
  switch (dictId) {
    case 'cet4':
      return CET4_DATA
    case 'cet6':
      return CET6_DATA
    default:
      // 检查自定义词典
      if (dictId.startsWith('custom_')) {
        const customDicts = storage.getCustomDicts()
        const customDict = customDicts.find(d => d.id === dictId)
        return customDict ? customDict.words : null
      }
      return null
  }
}
```

### 修改 4: 增强错误处理

**文件**: `utils/dict.js` - `getChapterWords()`

```javascript
function getChapterWords(dictId, chapter) {
  const dictData = getDictData(dictId)
  if (!dictData) {
    console.error('Dictionary not found:', dictId)  // 添加日志
    return []
  }

  const dictInfo = getDictInfo(dictId)
  if (!dictInfo) {
    console.error('Dictionary info not found:', dictId)  // 添加日志
    return []
  }

  const wordsPerChapter = dictInfo.wordsPerChapter
  const startIndex = chapter * wordsPerChapter
  const endIndex = Math.min(startIndex + wordsPerChapter, dictData.length)

  return dictData.slice(startIndex, endIndex)
}
```

### 修改 5: 改进 typing 页面错误提示

**文件**: `pages/typing/typing.js` - `loadChapter()`

**修改前**:
```javascript
loadChapter() {
  const { dictId, chapter } = this.data
  const dictInfo = dictUtil.getDictInfo(dictId)
  const words = dictUtil.getChapterWords(dictId, chapter)
  
  if (words.length === 0) {
    wx.showToast({ title: '章节加载失败', icon: 'none' })
    return
  }
  // ...
}
```

**修改后**:
```javascript
loadChapter() {
  const { dictId, chapter } = this.data
  const dictInfo = dictUtil.getDictInfo(dictId)
  
  // 先检查词典信息
  if (!dictInfo) {
    console.error('词典信息加载失败:', dictId)
    wx.showModal({
      title: '词典加载失败',
      content: '未找到该词典，是否返回词典选择页面？',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/gallery/gallery' })
        }
      }
    })
    return
  }

  const words = dictUtil.getChapterWords(dictId, chapter)
  
  if (words.length === 0) {
    wx.showToast({ title: '章节加载失败', icon: 'none' })
    return
  }
  // ...
}
```

### 修改 6: 添加 onShow 生命周期

**文件**: `pages/typing/typing.js`

```javascript
onShow() {
  // 页面显示时重新加载设置（可能从词典页面切换了词典）
  const settings = storage.getSettings()
  const { dictId, chapter } = this.data
  
  // 如果词典或章节改变了，重新加载
  if (settings.currentDictId !== dictId || settings.currentChapter !== chapter) {
    this.setData({
      dictId: settings.currentDictId,
      chapter: settings.currentChapter,
    })
    this.loadChapter()
  }
},
```

**原因**: 确保从词典页面切换词典后，typing 页面能自动刷新

---

## 修改文件清单

| 文件 | 修改内容 | 代码行数变化 |
|------|----------|------------|
| `utils/dict.js` | 添加自定义词典支持 | +39 行 |
| `pages/typing/typing.js` | 改进错误处理和生命周期 | +23 行 |

---

## 测试验证

### 测试场景 1: 添加并使用自定义词典

**步骤**:
1. 打开词典页面
2. 点击"+ 添加"
3. 输入词典名称："我的单词本"
4. 输入单词列表:
   ```
   hello
   n. 你好
   
   world
   n. 世界
   
   test
   n. 测试
   ```
5. 点击"保存词典"
6. 选择新创建的词典

**预期结果**: ✅
- 成功创建自定义词典
- 打字练习页面正常加载
- 显示词典名称："我的单词本"
- 显示章节信息："第1章/共1章"
- 显示单词数量："1/3"
- 可以正常输入练习

### 测试场景 2: 大量单词的自定义词典

**步骤**:
1. 创建包含 300 个单词的自定义词典
2. 选择该词典

**预期结果**: ✅
- 自动分为 2 章（200 + 100）
- 第 1 章显示 200 个单词
- 第 2 章显示 100 个单词

### 测试场景 3: 切换词典

**步骤**:
1. 当前使用自定义词典
2. 切换到 CET4 预设词典
3. 再切换回自定义词典

**预期结果**: ✅
- 每次切换都能正确加载
- 页面数据正确更新
- 无加载错误

### 测试场景 4: 删除正在使用的词典

**步骤**:
1. 选择自定义词典 A
2. 返回词典页面
3. 删除自定义词典 A
4. 返回打字练习页面

**预期结果**: ✅
- 显示友好的错误提示
- 提供返回词典页面的选项
- 不会出现白屏或崩溃

---

## 技术要点

### 1. 词典 ID 命名规则

```javascript
// 预设词典: 使用固定 ID
'cet4', 'cet6'

// 自定义词典: 使用 custom_ 前缀 + 时间戳
'custom_1738166400000'
```

### 2. 数据结构统一

确保自定义词典和预设词典返回相同的数据结构：

```javascript
{
  id: 'custom_xxx',
  name: '词典名称',
  description: '描述',
  wordsPerChapter: 200,
  totalWords: 100,
  totalChapters: 1
}
```

### 3. 性能考虑

每次调用 `getDictInfo()` 或 `getDictData()` 都会读取 localStorage：

```javascript
const customDicts = storage.getCustomDicts()  // 每次都读取
```

**优化建议** (未来):
- 添加缓存机制
- 只在词典变更时重新读取

### 4. 错误处理层次

```
1. 数据层 (dict.js): 返回 null，打印错误日志
   ↓
2. 业务层 (typing.js): 检查 null，显示用户友好提示
   ↓
3. 用户层: 看到明确的错误信息和解决方案
```

---

## 影响范围

### 受益功能
- ✅ 自定义词典创建
- ✅ 自定义词典使用
- ✅ 词典切换
- ✅ 错误提示

### 无影响功能
- ✅ 预设词典（CET4/CET6）
- ✅ 错题本
- ✅ 单词发音
- ✅ 本地存储

---

## 后续优化建议

### 1. 性能优化
```javascript
// 添加缓存
let customDictsCache = null
let cacheTimestamp = 0

function getDictInfo(dictId) {
  const now = Date.now()
  if (!customDictsCache || now - cacheTimestamp > 5000) {
    customDictsCache = storage.getCustomDicts()
    cacheTimestamp = now
  }
  // 使用缓存...
}
```

### 2. 功能增强
- 支持编辑自定义词典
- 支持导入/导出词典
- 支持词典排序
- 支持词典分享

### 3. 错误恢复
- 自动检测损坏的词典数据
- 提供修复或重建选项

---

## 相关文档

- `doc/FIX_LOG.md` - 问题 #001 (WXML 和 JSON 加载修复)
- `AGENTS.md` - 开发规范
- `README.md` - 项目文档

---

**修复状态**: ✅ 已完成  
**测试状态**: ✅ 已验证  
**文档状态**: ✅ 已更新  

**最后更新**: 2026-01-29
