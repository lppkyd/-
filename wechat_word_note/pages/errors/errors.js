// pages/errors/errors.js
const storage = require('../../utils/storage.js');
const api = require('../../utils/api.js');
const snapshot = require('../../utils/snapshot.js');
const audio = require('../../utils/audio.js');

function extractList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
  return null;
}

Page({
  // 修正：改为 errorWords 匹配 wx:for="{{errorWords}}"
  data: { errorWords: [], loginUser: null, isLoading: false, sortType: 'wrongCount', settings: {} },
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
      if (list) {
        const errorWords = list.map(item => ({
           ...item,
           // 修正：WXML 是 wx:for="{{item.trans}}" 循环，必须转成数组
           trans: typeof item.trans === 'string' ? item.trans.split(/[;\n,]/).filter(Boolean) : (item.trans || [])
        }));
        this.setData({ errorWords, isLoading: false });
        this.sortData(); // 加载后应用排序
        return;
      }
    } catch (err) { console.error('获取错题失败:', err); } 
    finally { wx.hideNavigationBarLoading(); }
    
    const fallbackRecords = storage.getErrorsByUser(userId);
    this.setData({ errorWords: fallbackRecords, isLoading: false });
    this.sortData();
  },

  async deleteWord(e) {
    const word = e.currentTarget.dataset.word;
    const loginUser = this.data.loginUser;
    if(!loginUser) return;
    
    const item = this.data.errorWords.find(i => i.word === word);
    try {
      if (item && item.id) await api.deleteErrorWord(item.id);
      storage.removeErrorWord(word, loginUser.userId);
    } catch(err) {
      storage.removeErrorWord(word, loginUser.userId);
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
           storage.clearErrors(self.data.loginUser.userId);
           // 云端直接拉新即可，如果后端有清空接口可在这里调用
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
    wx.showToast({ title: '已将 ' + word + ' 调取，敬请期待错题专练功能', icon: 'none' });
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
      this.setData({ errorWords: arr });
  },

  goBack() { wx.navigateBack({ delta: 1 }) },
  goHome() { wx.reLaunch({ url: '/pages/gallery/gallery' }) },
  goLogout() { storage.clearLoginSession(); wx.reLaunch({ url: '/pages/login/login' }) }
})