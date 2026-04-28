# Qwerty Learner 微信小程序 - MVP 版本

## 📱 项目简介

这是 Qwerty Learner 的微信小程序极简版本，专注于核心的打字练习功能。

### 核心功能

- ✅ **打字练习** - 逐字母输入，实时校验
- ✅ **预设词典** - CET4、CET6 两个词典
- ✅ **自定义词典** - 用户可添加自己的词汇
- ✅ **错题本** - 自动收集错词，支持查看和删除
- ✅ **单词发音** - 调用有道词典 API

## 🚀 快速开始

### 1. 环境准备

- 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册微信小程序账号（可选，使用测试号也可以）

### 2. 导入项目

1. 打开微信开发者工具
2. 点击「导入项目」或「+」号
3. 选择项目目录：`qwerty-learner-mini`
4. AppID 选择「测试号」（或填入你的 AppID）
5. 点击「导入」

### 3. 添加 TabBar 图标

**重要**：由于 TabBar 需要图标文件，请按以下步骤操作：

#### 方法一：使用占位图标（快速测试）

暂时注释掉 `app.json` 中的 `tabBar` 配置：

```json
// 在 app.json 中找到 tabBar 部分，暂时注释掉
/*
"tabBar": {
  ...
},
*/
```

这样可以先运行起来，但没有底部导航栏。

#### 方法二：添加实际图标（推荐）

1. 准备 6 个图标文件（尺寸：81px × 81px）：

   - `typing.png` / `typing-active.png`
   - `gallery.png` / `gallery-active.png`
   - `errors.png` / `errors-active.png`

2. 放入 `images/` 目录

3. 保持 `app.json` 中的 tabBar 配置不变

**快捷获取图标**：

- 访问 [iconfont.cn](https://www.iconfont.cn/)
- 搜索：键盘、书本、笔记本
- 下载 PNG 格式，调整为 81×81px

### 4. 预览和调试

#### 4.1 模拟器预览

1. 项目导入后自动打开模拟器
2. 可以看到三个页面：
   - 打字练习
   - 词典选择
   - 错题本

#### 4.2 真机预览

1. 点击工具栏的「预览」按钮
2. 用微信扫描生成的二维码
3. 在手机上测试真实体验

#### 4.3 调试功能

**Console 调试**：

- 打开「调试器」→「Console」
- 查看日志输出

**Storage 查看**：

- 打开「调试器」→「Storage」
- 查看本地存储数据

**Network 监控**：

- 打开「调试器」→「Network」
- 查看 API 请求（发音接口）

## 📖 使用说明

### 打字练习页面

1. 默认进入打字练习页面
2. 在输入框中逐字母输入单词
3. 正确字母显示绿色 ✓，错误显示红色 ✗
4. 点击 🔊 播放单词发音
5. 输入错误的单词自动加入错题本
6. 完成章节后可选择下一章或重新练习

### 词典选择页面

1. 点击底部「词典」标签
2. 可选择 CET4 或 CET6
3. 点击「选择章节」可跳转到指定章节
4. 点击「+ 添加」可创建自定义词典

### 错题本页面

1. 点击底部「错题本」标签
2. 查看所有错词，按错误次数排序
3. 点击 🔊 播放发音
4. 点击 ✕ 删除单个错词
5. 点击「清空」删除所有错词

### 添加自定义词典

1. 在词典页面点击「+ 添加」
2. 输入词典名称
3. 按格式输入单词列表：

   ```
   apple
   n. 苹果

   banana
   n. 香蕉
   ```

4. 点击「保存词典」

## 🛠️ 开发调试技巧

### 1. 清除数据

如果遇到问题，可以清除本地数据：

```
调试器 → Storage → 选中所有 → 删除
```

### 2. 查看词典数据

在 Console 中运行：

```javascript
const dict = require('./utils/dict.js')
console.log(dict.getDictInfo('cet4'))
```

### 3. 测试发音功能

确保：

- 开发者工具中「不校验合法域名」已勾选
- 或在小程序后台配置域名：`https://dict.youdao.com`

### 4. 调试输入逻辑

在 `typing.js` 的 `onInput` 方法中添加日志：

```javascript
console.log('输入:', input, '目标:', target)
```

## 📁 项目结构

```
qwerty-learner-mini/
├── app.js                  # 应用入口
├── app.json                # 全局配置
├── app.wxss                # 全局样式
├── data/
│   ├── cet4.json           # CET4 词典 (~488KB)
│   └── cet6.json           # CET6 词典 (~471KB)
├── utils/
│   ├── storage.js          # 本地存储
│   ├── audio.js            # 发音播放
│   └── dict.js             # 词典处理
├── pages/
│   ├── typing/             # 打字练习页
│   ├── gallery/            # 词典选择页
│   ├── errors/             # 错题本页
│   └── add-dict/           # 添加词典页
└── images/                 # TabBar 图标
```

## 🐛 常见问题

### 1. 发音播放失败

**原因**：网络请求域名未配置

**解决**：

- 开发阶段：勾选「不校验合法域名」
- 生产环境：在小程序后台配置 `https://dict.youdao.com`

### 2. TabBar 不显示

**原因**：缺少图标文件

**解决**：

- 临时：注释掉 `app.json` 中的 `tabBar` 配置
- 永久：添加 6 个图标文件到 `images/` 目录

### 3. 词典加载慢

**原因**：JSON 文件较大（~1MB）

**优化**：

- 首次加载会稍慢，后续会缓存
- 可以考虑按需加载章节数据

### 4. 输入法问题

**现象**：输入时候键盘遮挡

**解决**：

- 已设置 `adjust-position="{{true}}"`
- 如仍有问题，可调整页面 padding-bottom

## 📝 数据格式

### 词典格式

```json
[
  {
    "name": "apple",
    "trans": ["n. 苹果"],
    "usphone": "ˈæpl",
    "ukphone": "ˈæpl"
  }
]
```

### 本地存储

- `settings` - 用户设置
- `custom_dicts` - 自定义词典
- `error_words` - 错题记录
- `progress` - 学习进度

## 🎯 后续优化方向

- [ ] 添加更多预设词典（分包加载）
- [ ] 学习统计图表
- [ ] 复习模式
- [ ] 云同步功能
- [ ] 虚拟键盘模式

## 📄 开源协议

MIT License

## 💬 反馈与支持

如遇到问题或有建议，欢迎反馈！
