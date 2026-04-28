// utils/storage.js
// 本地存储封装（支持登录态、用户资产、词典数据）

const KEYS = {
  SETTINGS: 'settings',
  CUSTOM_DICTS: 'custom_dicts',
  ERROR_WORDS: 'error_words',
  PROGRESS: 'progress',
  FAVORITES: 'favorites',
  STUDY_RECORDS: 'study_records',
  SAVED_WORDS: 'saved_words',
  USER_INFO: 'user_info',
  LOGIN_ROLE: 'login_role',
  LOGIN_USER: 'login_user',
}

const DEFAULT_SETTINGS = {
  currentDictId: 'cet4',
  currentChapter: 0,
  pronunciationType: 'us',
  isShowTranslation: true,
  maskingMode: 0,
}

function getSettings() { try { return wx.getStorageSync(KEYS.SETTINGS) || DEFAULT_SETTINGS } catch (e) { console.error('读取设置失败:', e); return DEFAULT_SETTINGS } }
function saveSettings(settings) { try { wx.setStorageSync(KEYS.SETTINGS, settings); return true } catch (e) { console.error('保存设置失败:', e); return false } }
function updateSettings(updates) { return saveSettings({ ...getSettings(), ...updates }) }

function getLoginRole() { try { return wx.getStorageSync(KEYS.LOGIN_ROLE) || '' } catch (e) { return '' } }
function getLoginUser() { try { return wx.getStorageSync(KEYS.LOGIN_USER) || null } catch (e) { return null } }
function setLoginSession(role, user) { wx.setStorageSync(KEYS.LOGIN_ROLE, role); wx.setStorageSync(KEYS.LOGIN_USER, user); return true }
function clearLoginSession() { wx.removeStorageSync(KEYS.LOGIN_ROLE); wx.removeStorageSync(KEYS.LOGIN_USER); return true }

function getCustomDicts() { try { return wx.getStorageSync(KEYS.CUSTOM_DICTS) || [] } catch (e) { console.error('读取自定义词典失败:', e); return [] } }
function addCustomDict(dict) { try { const dicts = getCustomDicts(); const newDict = { id: `custom_${Date.now()}`, name: dict.name, description: dict.description || '', words: dict.words || [], createdAt: Date.now() }; dicts.push(newDict); wx.setStorageSync(KEYS.CUSTOM_DICTS, dicts); return newDict } catch (e) { console.error('添加自定义词典失败:', e); return null } }
function deleteCustomDict(dictId) { try { wx.setStorageSync(KEYS.CUSTOM_DICTS, getCustomDicts().filter(item => item.id !== dictId)); return true } catch (e) { console.error('删除自定义词典失败:', e); return false } }
function updateCustomDict(dictId, updates) { try { const dicts = getCustomDicts().map(item => item.id === dictId ? { ...item, ...updates } : item); wx.setStorageSync(KEYS.CUSTOM_DICTS, dicts); return true } catch (e) { console.error('更新自定义词典失败:', e); return false } }
function addWordToCustomDict(dictId, word) { try { const dicts = getCustomDicts().map(item => { if (item.id !== dictId) return item; const words = item.words || []; words.push(word); return { ...item, words } }); wx.setStorageSync(KEYS.CUSTOM_DICTS, dicts); return true } catch (e) { console.error('自定义词典加词失败:', e); return false } }

function getErrorWords() { try { return wx.getStorageSync(KEYS.ERROR_WORDS) || [] } catch (e) { console.error('读取错题本失败:', e); return [] } }
function getErrorWordsByUser(userId) { return getErrorWords().filter(item => String(item.userId || '') === String(userId || '')) }
function addErrorWord(word, dictId, userId = '') { try { const errors = getErrorWords(); const existing = errors.find(item => item.word === word.name && item.dictId === dictId && String(item.userId || '') === String(userId || '')); if (existing) { existing.wrongCount += 1; existing.lastWrongAt = Date.now() } else { errors.push({ userId, word: word.name, trans: word.trans, usphone: word.usphone, ukphone: word.ukphone, dictId, wrongCount: 1, lastWrongAt: Date.now() }) } wx.setStorageSync(KEYS.ERROR_WORDS, errors); return true } catch (e) { console.error('添加错词失败:', e); return false } }
function deleteErrorWord(word, dictId, userId = '') { try { wx.setStorageSync(KEYS.ERROR_WORDS, getErrorWords().filter(item => !(item.word === word && item.dictId === dictId && String(item.userId || '') === String(userId || '')))); return true } catch (e) { console.error('删除错词失败:', e); return false } }
function clearErrorWords() { try { wx.setStorageSync(KEYS.ERROR_WORDS, []); return true } catch (e) { console.error('清空错题本失败:', e); return false } }

function getProgress() { try { return wx.getStorageSync(KEYS.PROGRESS) || {} } catch (e) { console.error('读取学习进度失败:', e); return {} } }
function updateProgress(dictId, chapter, wordIndex = 0, userId = '') { try { const progress = getProgress(); const key = `${userId || 'guest'}_${dictId}`; if (!progress[key]) progress[key] = { currentChapter: 0, completedChapters: [], chapterProgress: {} }; progress[key].currentChapter = chapter; progress[key].chapterProgress[chapter] = wordIndex; wx.setStorageSync(KEYS.PROGRESS, progress); return true } catch (e) { console.error('更新学习进度失败:', e); return false } }
function updateWordProgress(dictId, chapter, wordIndex, userId = '') { return updateProgress(dictId, chapter, wordIndex, userId) }
function markChapterCompleted(dictId, chapter, userId = '') { try { const progress = getProgress(); const key = `${userId || 'guest'}_${dictId}`; if (!progress[key]) progress[key] = { currentChapter: 0, completedChapters: [], chapterProgress: {} }; progress[key].currentChapter = chapter; if (!progress[key].completedChapters.includes(chapter)) progress[key].completedChapters.push(chapter); wx.setStorageSync(KEYS.PROGRESS, progress); return true } catch (e) { console.error('标记章节完成失败:', e); return false } }
function getChapterProgress(dictId, chapter, userId = '') { const progress = getProgress(); const key = `${userId || 'guest'}_${dictId}`; if (progress[key] && progress[key].chapterProgress) return progress[key].chapterProgress[chapter] || 0; return 0 }
function getStudyRecords() { try { return wx.getStorageSync(KEYS.STUDY_RECORDS) || [] } catch (e) { console.error('读取学习记录失败:', e); return [] } }
function getStudyRecordsByUser(userId) { return getStudyRecords().filter(item => String(item.userId || '') === String(userId || '')) }
function addStudyRecord(record) { try { const records = getStudyRecords(); records.unshift({ id: Date.now(), createdAt: Date.now(), ...record }); wx.setStorageSync(KEYS.STUDY_RECORDS, records); return true } catch (e) { console.error('添加学习记录失败:', e); return false } }

function getFavorites() { try { return wx.getStorageSync(KEYS.FAVORITES) || [] } catch (e) { console.error('读取收藏失败:', e); return [] } }
function getFavoritesByUser(userId) { return getFavorites().filter(item => String(item.userId || '') === String(userId || '')) }
function toggleFavorite(word, userId = '') { try { const favorites = getFavorites(); const index = favorites.findIndex(item => item.word === word.name && String(item.userId || '') === String(userId || '')); if (index >= 0) favorites.splice(index, 1); else favorites.push({ userId, word: word.name, trans: word.trans, usphone: word.usphone, ukphone: word.ukphone, createdAt: Date.now() }); wx.setStorageSync(KEYS.FAVORITES, favorites); return true } catch (e) { console.error('收藏操作失败:', e); return false } }

function getSavedWords() { try { return wx.getStorageSync(KEYS.SAVED_WORDS) || [] } catch (e) { console.error('读取生词本失败:', e); return [] } }
function getSavedWordsByUser(userId) { return getSavedWords().filter(item => String(item.userId || '') === String(userId || '')) }
function addSavedWord(word, userId = '') { try { const list = getSavedWords(); const exists = list.find(item => item.word === word.name && String(item.userId || '') === String(userId || '')); if (!exists) list.unshift({ userId, word: word.name, trans: word.trans, usphone: word.usphone, ukphone: word.ukphone, example: word.example || '', createdAt: Date.now() }); wx.setStorageSync(KEYS.SAVED_WORDS, list); return true } catch (e) { console.error('保存生词失败:', e); return false } }
function deleteSavedWord(word, userId = '') { try { wx.setStorageSync(KEYS.SAVED_WORDS, getSavedWords().filter(item => !(item.word === word && String(item.userId || '') === String(userId || '')))); return true } catch (e) { console.error('删除生词失败:', e); return false } }

module.exports = { KEYS, DEFAULT_SETTINGS, getSettings, saveSettings, updateSettings, getLoginRole, getLoginUser, setLoginSession, clearLoginSession, getCustomDicts, addCustomDict, deleteCustomDict, updateCustomDict, addWordToCustomDict, getErrorWords, getErrorWordsByUser, addErrorWord, deleteErrorWord, clearErrorWords, getProgress, updateProgress, updateWordProgress, markChapterCompleted, getChapterProgress, getFavorites, getFavoritesByUser, toggleFavorite, getStudyRecords, getStudyRecordsByUser, addStudyRecord, getSavedWords, getSavedWordsByUser, addSavedWord, deleteSavedWord }
