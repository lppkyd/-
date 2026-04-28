# 新增功能: 单词遮盖模式 (Masking Mode)

**日期**: 2026-01-29  
**版本**: v1.1.0  
**开发者**: AI Agent (Antigravity Claude)

---

## 功能概述

在打字练习页面新增了"单词遮盖模式"切换功能。用户可以点击顶部状态栏的模式切换按钮，在以下三种模式间循环切换：

1. **无遮盖 (Display)**: 默认模式，完整显示单词。
2. **随机遮盖 (Random)**: 随机隐藏单词中的部分字母（约50%），增加记忆难度。
3. **全遮盖 (Hidden)**: 隐藏所有字母，仅在输入正确后显示，用于盲打训练。

该设置会自动保存到本地存储，下次打开应用时保持上次的选择。

---

## 技术实现

### 1. 数据存储 (`utils/storage.js`)

在全局设置 `DEFAULT_SETTINGS` 中新增了 `maskingMode` 字段：

```javascript
const DEFAULT_SETTINGS = {
  // ... 其他设置
  maskingMode: 0, // 0: 无遮盖, 1: 随机, 2: 全部
}
```

### 2. 页面逻辑 (`pages/typing/typing.js`)

#### 状态管理
新增了以下页面数据：
```javascript
data: {
  maskingMode: 0,
  maskingModes: ['无遮盖', '随机', '全遮盖'],
  displayWord: '',    // 用于显示的单词（可能包含 * 号）
  visibilityMask: [], // 记录每个字母的可见性
  // ...
}
```

#### 核心方法

**`updateWordDisplay(word)`**:
根据当前模式计算掩码和显示文本。
- **模式 0**: 全 `true`
- **模式 2**: 全 `false`
- **模式 1**: 随机生成 `true`/`false`，并确保至少有一个字母被遮盖（如果长度允许）。

**`switchMaskingMode()`**:
切换模式并保存设置：
```javascript
switchMaskingMode() {
  let mode = this.data.maskingMode + 1
  if (mode > 2) mode = 0
  
  this.setData({ maskingMode: mode })
  storage.updateSettings({ maskingMode: mode })
  
  if (this.data.currentWord) {
    this.updateWordDisplay(this.data.currentWord)
  }
}
```

### 3. UI 实现 (`pages/typing/typing.wxml`)

#### 模式切换按钮
在顶部 Header 区域添加了切换按钮：
```xml
<view class="mode-toggle" bindtap="switchMaskingMode">
  <text class="mode-text">👁 {{maskingModes[maskingMode]}}</text>
</view>
```

#### 单词显示
主单词显示区域绑定 `displayWord` 而非 `currentWord.name`：
```xml
<text class="word-text">{{displayWord}}</text>
```

#### 字母提示框
字母提示框现在结合了掩码和输入状态。
逻辑：**如果字母被掩盖 (mask=false) 且 尚未输入 (pending)，则隐藏字母。**

```xml
<text class="letter" wx:if="{{visibilityMask[index] || item !== 'pending'}}">
  {{currentWord.name[index]}}
</text>
```
这意味着：
- 如果掩码允许显示 (`visibilityMask[index] == true`) -> 显示
- 如果用户已经输入 (`item !== 'pending'`) -> 显示（即使用户输错了，也显示正确字母以便对比，或者根据设计显示用户输入的字母？当前逻辑是显示原单词字母，符合练习逻辑）

---

## 验证与测试

### 测试用例

1. **模式切换**:
   - 点击按钮，确认文字在 "无遮盖" -> "随机" -> "全遮盖" -> "无遮盖" 之间循环。
   - 确认主单词显示区随之变化（全显 -> 带星号 -> 全星号）。

2. **输入交互**:
   - 在"全遮盖"模式下输入：初始全为 `*`，输入正确字母后，提示框中显示出该字母。
   - 在"随机遮盖"模式下输入：被遮住的字母（空白框）在输入后显示出来。

3. **数据持久化**:
   - 切换到"随机"模式。
   - 重启小程序或重新编译。
   - 确认进入页面时仍为"随机"模式。

---

## 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `utils/storage.js` | Modify | 添加 `maskingMode` 默认设置 |
| `pages/typing/typing.js` | Modify | 添加模式切换、掩码生成逻辑 |
| `pages/typing/typing.wxml` | Modify | 添加按钮、应用掩码显示逻辑 |
| `pages/typing/typing.wxss` | Modify | 添加按钮样式 |

---

## 后续优化建议

- **自定义随机比例**: 目前固定约为 50% 随机遮盖，未来可允许用户调节难度。
- **渐进式提示**: 在全遮盖模式下，如果用户长时间未输入，可闪烁提示第一个字母。

---

**文档维护**: AI Coding Agents  
**最后更新**: 2026-01-29
