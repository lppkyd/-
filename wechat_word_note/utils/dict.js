// utils/dict.js
const storage = require('./storage.js')
const api = require('./api.js')

let CET4_DATA = []
let CET6_DATA = []
let GENERAL1_DATA = []
let GENERAL2_DATA = []
let REMOTE_CATEGORIES = []
let REMOTE_WORDS = []

try { CET4_DATA = require('../data/cet4_v2.js') } catch (e) { console.error('Failed to load CET4 data:', e) }
try { CET6_DATA = require('../data/cet6_v2.js') } catch (e) { console.error('Failed to load CET6 data:', e) }
try { GENERAL1_DATA = require('../data/general1.json') } catch (e) { console.error('Failed to load general1 data:', e) }
try { GENERAL2_DATA = require('../data/general2.json') } catch (e) { console.error('Failed to load general2 data:', e) }

const DICT_INFO = {
  cet4: { id: 'cet4', name: 'CET4 四级词汇', description: '大学英语四级核心词汇', wordsPerChapter: 200, totalWords: 0, totalChapters: 0, source: 'local' },
  cet6: { id: 'cet6', name: 'CET6 六级词汇', description: '大学英语六级核心词汇', wordsPerChapter: 200, totalWords: 0, totalChapters: 0, source: 'local' },
  general1: { id: 'general1', name: '通用词典 A', description: '日常高频常用词汇', wordsPerChapter: 200, totalWords: 0, totalChapters: 0, source: 'local' },
  general2: { id: 'general2', name: '通用词典 B', description: '常见场景英语词汇', wordsPerChapter: 200, totalWords: 0, totalChapters: 0, source: 'local' },
}

function countLocalWords(data) { return (data.categories || []).reduce((sum, cat) => sum + (cat.words ? cat.words.length : 0), 0) }
function initDictInfo() { DICT_INFO.cet4.totalWords = CET4_DATA.length; DICT_INFO.cet4.totalChapters = Math.max(1, Math.ceil(CET4_DATA.length / DICT_INFO.cet4.wordsPerChapter)); DICT_INFO.cet6.totalWords = CET6_DATA.length; DICT_INFO.cet6.totalChapters = Math.max(1, Math.ceil(CET6_DATA.length / DICT_INFO.cet6.wordsPerChapter)); DICT_INFO.general1.totalWords = countLocalWords(GENERAL1_DATA); DICT_INFO.general1.totalChapters = Math.max(1, Math.ceil(DICT_INFO.general1.totalWords / DICT_INFO.general1.wordsPerChapter)); DICT_INFO.general2.totalWords = countLocalWords(GENERAL2_DATA); DICT_INFO.general2.totalChapters = Math.max(1, Math.ceil(DICT_INFO.general2.totalWords / DICT_INFO.general2.wordsPerChapter)) }
initDictInfo()

async function refreshRemoteData() { try { const [categoriesRes, wordsRes] = await Promise.all([api.getCategories(), api.getWords()]); REMOTE_CATEGORIES = categoriesRes.data || []; REMOTE_WORDS = wordsRes.data || [] } catch (e) { console.warn('远程词库加载失败，继续使用本地数据:', e); REMOTE_CATEGORIES = []; REMOTE_WORDS = [] } }
function normalizeRemoteWord(word) { return { name: word.word, trans: [word.meaning], usphone: word.phonetic || '', ukphone: word.phonetic || '', example: word.example || '', recommended: word.recommended } }
function flattenLocalDict(data) { return (data.categories || []).flatMap(cat => (cat.words || []).map(item => ({ ...item, categoryName: cat.name }))) }
function getDictInfo(dictId) { if (DICT_INFO[dictId]) return DICT_INFO[dictId]; if (dictId.startsWith('custom_')) { const customDicts = storage.getCustomDicts(); const customDict = customDicts.find(d => d.id === dictId); if (customDict) { const totalWords = customDict.words.length; const wordsPerChapter = 200; return { id: customDict.id, name: customDict.name, description: '自定义词典', wordsPerChapter, totalWords, totalChapters: Math.max(1, Math.ceil(totalWords / wordsPerChapter)), source: 'local' } } } const remoteCategory = REMOTE_CATEGORIES.find(item => String(item.id) === String(dictId)); if (remoteCategory) { const remoteWords = REMOTE_WORDS.filter(item => String(item.categoryId) === String(dictId)); return { id: String(remoteCategory.id), name: remoteCategory.name, description: '后端词库', wordsPerChapter: 200, totalWords: remoteWords.length, totalChapters: Math.max(1, Math.ceil(remoteWords.length / 200)), source: 'remote' } } return null }
function getAllPresetDicts() { return Object.values(DICT_INFO) }
function getRemoteCategories() { return REMOTE_CATEGORIES.map(item => ({ id: String(item.id), name: item.name, description: '后端词库', wordsPerChapter: 200, totalWords: REMOTE_WORDS.filter(word => String(word.categoryId) === String(item.id)).length, totalChapters: 1, source: 'remote' })) }
function getDictData(dictId) { switch (dictId) { case 'cet4': return CET4_DATA; case 'cet6': return CET6_DATA; case 'general1': return flattenLocalDict(GENERAL1_DATA); case 'general2': return flattenLocalDict(GENERAL2_DATA); default: if (dictId.startsWith('custom_')) { const customDicts = storage.getCustomDicts(); const customDict = customDicts.find(d => d.id === dictId); return customDict ? customDict.words : null } const remoteWords = REMOTE_WORDS.filter(item => String(item.categoryId) === String(dictId)); if (remoteWords.length > 0) return remoteWords.map(normalizeRemoteWord); return null } }
function getChapterWords(dictId, chapter) { const dictData = getDictData(dictId); if (!dictData) return []; const dictInfo = getDictInfo(dictId); if (!dictInfo) return []; const wordsPerChapter = dictInfo.wordsPerChapter; const startIndex = chapter * wordsPerChapter; const endIndex = Math.min(startIndex + wordsPerChapter, dictData.length); return dictData.slice(startIndex, endIndex) }
function getWord(dictId, index) { const dictData = getDictData(dictId); if (!dictData || index < 0 || index >= dictData.length) return null; return dictData[index] }
function getChapterCount(dictId) { const dictInfo = getDictInfo(dictId); return dictInfo ? dictInfo.totalChapters : 0 }
function isValidChapter(dictId, chapter) { const chapterCount = getChapterCount(dictId); return chapter >= 0 && chapter < chapterCount }
module.exports = { DICT_INFO, refreshRemoteData, getDictInfo, getAllPresetDicts, getRemoteCategories, getDictData, getChapterWords, getWord, getChapterCount, isValidChapter }
