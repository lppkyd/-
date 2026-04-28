// utils/snapshot.js
const storage = require('./storage.js')
const api = require('./api.js')

function getCurrentUserId() {
  const user = storage.getLoginUser()
  return user && user.userId ? user.userId : ''
}

function normalizeList(list, mapper) {
  return (list || []).map(mapper)
}

function buildSnapshot() {
  const userId = getCurrentUserId()
  return {
    userId,
    loginUser: storage.getLoginUser(),
    settings: storage.getSettings(),
    favorites: normalizeList(storage.getFavoritesByUser(userId), item => ({
      word: item.word,
      trans: item.trans,
      usphone: item.usphone || '',
      ukphone: item.ukphone || '',
      createdAt: item.createdAt || Date.now(),
    })),
    errors: normalizeList(storage.getErrorWordsByUser(userId), item => ({
      word: item.word,
      trans: item.trans,
      dictId: item.dictId,
      wrongCount: item.wrongCount || 1,
      lastWrongAt: item.lastWrongAt || Date.now(),
    })),
    savedWords: normalizeList(storage.getSavedWordsByUser(userId), item => ({
      word: item.word,
      trans: item.trans,
      usphone: item.usphone || '',
      ukphone: item.ukphone || '',
      example: item.example || '',
      createdAt: item.createdAt || Date.now(),
    })),
    studyRecords: normalizeList(storage.getStudyRecordsByUser(userId), item => ({
      dictId: item.dictId,
      dictName: item.dictName,
      chapter: item.chapter,
      totalWords: item.totalWords,
      accuracy: item.accuracy,
      createdAt: item.createdAt || Date.now(),
    })),
    progress: storage.getProgress(),
  }
}

async function syncSnapshot() {
  const snapshot = buildSnapshot()
  if (!snapshot.userId) return { skipped: true }
  try {
    const result = await api.request('/sync/snapshot', {
      method: 'POST',
      body: snapshot,
    })
    return result
  } catch (error) {
    console.warn('同步快照失败：', error)
    return { success: false, message: error.message || '同步失败' }
  }
}

module.exports = {
  buildSnapshot,
  syncSnapshot,
}
