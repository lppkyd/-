# 功能更新: 中文翻译遮盖 (Chinese Masking)

**日期**: 2026-01-29  
**版本**: v1.1.1  
**开发者**: AI Agent (Antigravity Claude)

---

## 功能概述

在原有的英文单词遮盖模式基础上，新增了**中文翻译遮盖**功能。用户可以独立控制是否显示单词的中文释义。

---

## 修改详情

### 1. UI 调整 (`pages/typing/typing.wxml`)

顶部 Header 区域现在包含两个独立的切换按钮：
- **英文遮盖**: `👁 无遮盖` / `随机` / `全遮盖`
- **中文遮盖**: `译 显示` / `译 隐藏`

```xml
<view class="toggles">
  <view class="mode-toggle" bindtap="switchMaskingMode">...</view>
  <view class="mode-toggle" bindtap="switchTranslationMode">...</view>
</view>
```

### 2. 样式调整 (`pages/typing/typing.wxss`)

为了容纳两个按钮且保持界面整洁，使用了 Flex 布局将按钮垂直排列在中间或右侧（取决于具体布局需求，目前采用了 `align-items: flex-end` 和 `column` 排列以适应 header 空间）。

```css
.toggles {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: flex-end;
}
```

### 3. 逻辑实现 (`pages/typing/typing.js`)

新增 `switchTranslationMode` 方法：

```javascript
switchTranslationMode() {
  const newStatus = !this.data.settings.isShowTranslation
  this.setData({
    'settings.isShowTranslation': newStatus
  })
  storage.updateSettings({ isShowTranslation: newStatus })
}
```

该设置复用了已有的 `isShowTranslation` 字段，确保与全局设置兼容。

---

## 验证与测试

1. **点击测试**: 点击"译 显示"按钮，按钮文字变为"译 隐藏"，下方的中文释义立即消失。
2. **独立性测试**: 切换中文遮盖不影响英文单词的遮盖模式。
3. **持久化测试**: 退出应用后重进，中文显示状态应保持不变。

---

**文档维护**: AI Coding Agents  
**最后更新**: 2026-01-29
