# 渲染性能问题分析与修复报告

## 问题描述
在 `pages/gallery/gallery` 页面点击预设词典（如 CET4/CET6）进入 `pages/word-list/word-list` 详情页时，出现以下异常：
1. 页面加载极慢或出现白屏。
2. 开发者工具控制台无明显报错，或提示渲染层错误。
3. 用户自定义的小型词典可以正常显示。

## 问题原因分析
经过排查，问题根源在于**数据渲染量过大**。

1. **数据规模**：CET4 词典包含约 2600+ 个单词对象，CET6 包含 2300+ 个。
2. **渲染机制**：原代码在 `onLoad` 阶段尝试一次性将所有单词数据通过 `setData` 传递给视图层。
   ```javascript
   this.setData({
     words: words, // 2600+ items
     loading: false
   })
   ```
3. **平台限制**：微信小程序 `setData` 单次数据传输限制为 1MB。虽然 2600 个简单对象可能未严格超过 1MB，但一次性创建数千个 DOM 节点会造成渲染线程（WebView）阻塞，导致页面卡死。

## 修复方案：分页加载（Lazy Loading）

采用**前端分页 + 触底加载**的策略，避免一次性渲染大量节点。

### 核心逻辑
1. **数据分离**：将完整词典数据存储在 Page 实例的非响应式变量 `this.allWords` 中，而不是 `data` 中。
2. **分批渲染**：初始只加载第一页（例如 20 条）。
3. **触底追加**：监听 `onReachBottom` 事件，当用户滚动到底部时，追加下一页数据。
4. **性能优化**：使用基于索引的 `setData` 写法（Data Path），避免每次追加数据都传输整个数组。
   ```javascript
   // 优化前：传输整个新数组
   this.setData({ words: [...oldWords, ...newWords] })

   // 优化后：只传输新增部分
   const update = {}
   newWords.forEach((item, index) => {
       update[`words[${startIndex + index}]`] = item
   })
   this.setData(update)
   ```

### 实施结果
- 首屏加载时间显著降低（仅渲染 20 个节点）。
- 滚动流畅，内存占用减少。
- 解决了预设词典无法打开的问题。
