# Agent Development Guidelines

This document provides coding standards and development guidelines for AI agents working on the Qwerty Learner Mini Program codebase.

## Project Overview

**Type**: WeChat Mini Program (微信小程序)  
**Platform**: Native WeChat SDK v3.14.1  
**Language**: JavaScript (ES6)  
**Build Tool**: WeChat Developer Tools  
**Architecture**: MVVM (Page-based)

## Development Commands

### Testing & Building

**No traditional build commands** - This project uses WeChat Developer Tools for compilation and testing.

- **Compile**: Automatic in WeChat Developer Tools
- **Preview**: Click "Preview" button → Scan QR code with WeChat
- **Upload**: Click "Upload" button in DevTools
- **Debug Console**: DevTools → Console tab
- **Storage Inspector**: DevTools → Storage tab
- **Network Monitor**: DevTools → Network tab

### Testing a Single Page

1. Open WeChat Developer Tools
2. Click on specific page file in editor
3. In simulator, navigate to page path: `pages/{page-name}/{page-name}`
4. Use Console to debug: `console.log()` statements appear in DevTools

### Debugging Tips

- **Clear local storage**: DevTools → Storage → Select All → Delete
- **Disable domain check**: Settings → Local Settings → Check "Do not verify valid domain"
- **Test API calls**: Network tab shows requests to Youdao API
- **Reload simulator**: Cmd/Ctrl + R

## Project Structure

```
qwerty-learner-mini/
├── app.js                  # Application entry point
├── app.json                # Global configuration
├── app.wxss                # Global styles
├── data/
│   ├── cet4_v2.js         # CET4 dictionary module (~488KB, 3800 words)
│   ├── cet4.json          # CET4 source data (not used directly)
│   ├── cet6_v2.js         # CET6 dictionary module (~471KB, 2500 words)
│   └── cet6.json          # CET6 source data (not used directly)
├── utils/
│   ├── storage.js         # Local storage wrapper (312 lines)
│   ├── audio.js           # Audio playback (64 lines)
│   └── dict.js            # Dictionary data processing (156 lines)
├── pages/
│   ├── typing/            # Main typing practice page (440 lines)
│   ├── gallery/           # Dictionary selection page
│   ├── errors/            # Error word collection page
│   ├── add-dict/          # Custom dictionary creation
│   ├── add-word/          # Add word to custom dictionary
│   ├── word-list/         # View custom dictionary words
│   ├── user/              # User settings page
│   └── about/             # About page
└── images/                # TabBar icons (PNG format, 81x81px)
```

## Code Style Guidelines

### File Naming

- **Pages**: `{page-name}/` directory with 4 files: `.js`, `.json`, `.wxml`, `.wxss`
- **Utils**: `{module-name}.js` in lowercase
- **Constants**: Use `UPPER_SNAKE_CASE` for const objects

### JavaScript Conventions

#### 1. Module System

**Use CommonJS** (not ES modules):

```javascript
// Good
const storage = require('../../utils/storage.js')
module.exports = { functionName }

// Bad
import storage from '../../utils/storage.js'
export { functionName }
```

#### 2. Imports

Order imports by distance and type:

```javascript
// 1. Utility modules
const dictUtil = require('../../utils/dict.js')
const storage = require('../../utils/storage.js')
const audio = require('../../utils/audio.js')

// 2. Page logic follows
Page({ /* ... */ })
```

#### 3. Formatting

- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes `'string'` for strings
- **Semicolons**: Always use semicolons
- **Line length**: No strict limit, but prefer < 100 chars
- **Trailing commas**: Optional in objects/arrays

#### 4. Variable Naming

```javascript
// camelCase for variables and functions
const currentWord = 'apple'
function loadChapter() {}

// UPPER_SNAKE_CASE for constants
const DEFAULT_SETTINGS = {}
const KEYS = { SETTINGS: 'settings' }

// PascalCase for Page/Component constructors (WeChat convention)
Page({})
Component({})
```

#### 5. Data Structure

WeChat Mini Program uses `this.setData()` for reactive updates:

```javascript
Page({
  data: {
    // Initial data state
    currentWord: null,
    inputValue: '',
  },
  
  onLoad() {
    // Update data using setData
    this.setData({
      currentWord: { name: 'apple', trans: ['n. 苹果'] }
    })
  }
})
```

#### 6. Comments

- **File headers**: Single-line comment describing module purpose
- **Function comments**: Describe what function does (optional for obvious ones)
- **Inline comments**: Use sparingly, code should be self-documenting

```javascript
// utils/audio.js
// 音频播放封装

// 播放单词发音
function playPronunciation(word, type = 'us') {
  // Implementation
}
```

#### 7. Error Handling

Always use try-catch for storage operations:

```javascript
function getSettings() {
  try {
    const settings = wx.getStorageSync(KEYS.SETTINGS)
    return settings || DEFAULT_SETTINGS
  } catch (e) {
    console.error('读取设置失败:', e)
    return DEFAULT_SETTINGS
  }
}
```

Use Promise pattern for async operations:

```javascript
function playPronunciation(word, type = 'us') {
  return new Promise((resolve, reject) => {
    if (!word) {
      reject(new Error('单词不能为空'))
      return
    }
    // ... audio logic
  })
}
```

#### 8. Function Patterns

**Pure utility functions**:
```javascript
// Returns new data, no side effects
function getDictInfo(dictId) {
  return DICT_INFO[dictId] || null
}
```

**Page lifecycle methods**:
```javascript
Page({
  onLoad() { /* Initialize page */ },
  onShow() { /* Page visible */ },
  onUnload() { /* Cleanup */ }
})
```

### WeChat API Usage

#### Storage

```javascript
// Synchronous (preferred for small data)
wx.getStorageSync(key)
wx.setStorageSync(key, data)

// Asynchronous (for large data)
wx.getStorage({ key, success, fail })
wx.setStorage({ key, data, success, fail })
```

#### UI Interactions

```javascript
wx.showToast({ title: '提示', icon: 'none' })
wx.showModal({ title: '标题', content: '内容', success: (res) => {} })
wx.vibrateShort({ type: 'medium' })
```

#### Navigation

```javascript
wx.navigateTo({ url: '/pages/gallery/gallery' })
wx.redirectTo({ url: '/pages/typing/typing' })
wx.navigateBack()
```

## Type Safety

**No TypeScript** - This project uses plain JavaScript. Be careful with:

- Parameter types in function calls
- Data structure shapes (especially for storage)
- WeChat API responses

## Data Formats

### Dictionary Word Structure

```json
{
  "name": "apple",
  "trans": ["n. 苹果"],
  "usphone": "ˈæpl",
  "ukphone": "ˈæpl"
}
```

### Local Storage Keys

```javascript
settings        // User settings object
custom_dicts    // Array of custom dictionaries
error_words     // Array of error word records
progress        // Dictionary progress object
```

## External Dependencies

- **Youdao Dictionary API**: `https://dict.youdao.com/dictvoice` (for pronunciation)
- **WeChat APIs**: Storage, Audio, Navigation, Modal dialogs

## Best Practices

1. **Always clean up resources**: Call `audio.destroyAudio()` in `onUnload()`
2. **Validate data before storage**: Check for null/undefined before `setStorageSync`
3. **Provide user feedback**: Use `wx.showToast` for actions
4. **Handle errors gracefully**: Never let try-catch blocks fail silently without logging
5. **Keep functions small**: Max 50 lines per function
6. **Use descriptive names**: `loadChapter()` not `load()`
7. **No console.log in production**: Use proper error handling
8. **Test on real device**: Simulator behavior may differ from actual WeChat

## Common Pitfalls

- ❌ Using ES6 imports/exports (use CommonJS)
- ❌ Forgetting `.js` extension in require paths
- ❌ Direct DOM manipulation (use `setData` instead)
- ❌ Async operations without error handling
- ❌ Large dictionary files loaded at once (consider lazy loading)
- ❌ TabBar icons as SVG (WeChat requires PNG)
- ❌ Using `require()` with `.json` files directly (convert to `.js` modules with `module.exports`)

## Performance Considerations

- **Dictionary loading**: ~1MB JSON files loaded at startup
- **Storage limits**: WeChat localStorage max 10MB per domain
- **Main package limit**: 2MB (use subpackages for more)
- **setData frequency**: Don't call too frequently (causes lag)

## Documentation Files

- `README.md` - Complete project documentation
- `QUICK_START.md` - Quick preview guide (5 minutes)
- `PROJECT_SUMMARY.md` - Full project summary
- `TABBAR_FIX.md` - TabBar icon troubleshooting

## Making Changes

1. Read existing code in similar files first
2. Follow the established patterns (especially Page structure)
3. Test in WeChat DevTools simulator
4. Test on real device before considering complete
5. Update relevant documentation if adding features

---

**Last Updated**: 2026-01-30  
**Maintained For**: AI Coding Agents (Claude, Cursor, Copilot, etc.)
