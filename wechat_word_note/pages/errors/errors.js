// pages/errors/errors.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');
const snapshot = require('../../utils/snapshot.js');
const audio = require('../../utils/audio.js');

function extractList(res) {
  let data = res;
  if (typeof res === 'string') try { data = JSON.parse(res); } catch (e) {}
  else if (res && typeof res.data === 'string') try { data = JSON.parse(res.data); } catch (e) {}

  let list = [];
  if (Array.isArray(data)) list = data;
  else if (data && Array.isArray(data.data)) list = data.data;
  else if (res && res.data && Array.isArray(res.data)) list = res.data;
  
  return list.map(rawItem => {
    if (typeof rawItem === 'string' && rawItem.trim().startsWith('{')) {
      try { return JSON.parse(rawItem); } catch (e) { return {}; }
    }
    return rawItem;
  });
}

Page({
  data: { errorWords: [], records: [], errors: [], loginUser: null, isLoading: false, sortType: 'wrongCount', settings: {} },
  onLoad() { this.setData({ settings: storage.getSettings() }); this.loadData() },
  onShow() { this.loadData() },

  async loadData() {
    const loginUser = storage.getLoginUser();
    const userId = loginUser && loginUser.userId ? loginUser.userId : '';
    this.setData({ loginUser, isLoading: true });
    if (!userId) { this.setData({ isLoading: false }); return; }

    wx.showNavigationBarLoading();
    try {
      const res = await api.getUserErrors(userId);
      const list = extractList(res);
      if (list && list.length > 0) {
        const errorWords = list.map(item => ({
           ...item,
           trans: typeof item.trans === 'string' ? item.trans.split(/[;\n,]/).filter(Boolean) : (item.trans || [])
        }));
        // 核心修复：注入多重别名防止 WXML 找错对象
        this.setData({ errorWords, records: errorWords, errors: errorWords, isLoading: false });
        this.sortData(); 
        return;
      }
    } catch (err) { console.error('获取错题失败:', err); } 
    finally { wx.hideNavigationBarLoading(); }
    
    // 安全获取本地存储，兼容两种可能存在的方法名
    const localErr = storage.getErrorsByUser ? storage.getErrorsByUser(userId) : (storage.getErrorWordsByUser ? storage.getErrorWordsByUser(userId) : []);
    const fallbackRecords = localErr.map(item => ({
       ...item,
       trans: typeof item.trans === 'string' ? item.trans.split(/[;\n,]/).filter(Boolean) : (item.trans || [])
    }));
    this.setData({ errorWords: fallbackRecords, records: fallbackRecords, errors: fallbackRecords, isLoading: false });
    this.sortData();
  },

  async deleteWord(e) {
    const word = e.currentTarget.dataset.word;
    const loginUser = this.data.loginUser;
    if(!loginUser) return;
    
    const item = this.data.errorWords.find(i => i.word === word);
    const dictId = item ? item.dictId : 'custom';

    try {
      if (item && item.id) await api.deleteErrorWord(item.id);
      if (storage.deleteErrorWord) storage.deleteErrorWord(word, dictId, loginUser.userId);
      else if (storage.removeErrorWord) storage.removeErrorWord(word, loginUser.userId);
    } catch(err) {
      if (storage.deleteErrorWord) storage.deleteErrorWord(word, dictId, loginUser.userId);
      else if (storage.removeErrorWord) storage.removeErrorWord(word, loginUser.userId);
      snapshot.syncSnapshot();
    }
    this.loadData();
  },

  clearAll() {
    if(!this.data.loginUser) return;
    const self = this;
    wx.showModal({
      title: '清空错题本', content: '确定要清空所有错题记录吗？',
      success: async (res) => {
        if (res.confirm) {
           if (storage.clearErrorWords) storage.clearErrorWords();
           else if (storage.clearErrors) storage.clearErrors(self.data.loginUser.userId);
           self.loadData();
        }
      }
    });
  },

  playSound(e) {
    const word = e.currentTarget.dataset.word;
    audio.playPronunciation(word, this.data.settings.pronunciationType || 'uk').catch(() => {});
  },

  practiceWord(e) {
    const word = e.currentTarget.dataset.word;
    const dictId = e.currentTarget.dataset.dictid || 'cet4';
    
    wx.showModal({
      title: '继续练习',
      content: `是否前往打字练习页面，重新练习包含【${word}】的词库？`,
      success: (res) => {
        if (res.confirm) {
          wx.reLaunch({ url: `/pages/typing/typing?dictId=${dictId}` });
        }
      }
    });
  },

  sortByWrongCount() { this.setData({ sortType: 'wrongCount' }); this.sortData(); },
  sortByTime() { this.setData({ sortType: 'time' }); this.sortData(); },
  
  sortData() {
      let arr = [...this.data.errorWords];
      if (this.data.sortType === 'wrongCount') { 
         arr.sort((a,b) => (b.wrongCount || 0) - (a.wrongCount || 0)); 
      } else { 
         arr.sort((a,b) => new Date(String(b.lastWrongAt || b.created_at || '').replace(/-/g, '/')).getTime() - new Date(String(a.lastWrongAt || a.created_at || '').replace(/-/g, '/')).getTime()); 
      }
      this.setData({ errorWords: arr, records: arr, errors: arr });
  },

  goBack() { wx.navigateBack({ delta: 1 }) },
  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) }
})