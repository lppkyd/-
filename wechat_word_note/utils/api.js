const BASE_URL = 'http://127.0.0.1:8080/api'

function getUserStudyRecords(userId) { return request(`/users/${userId}/study-records`) }
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method: options.method || 'GET',
      data: options.data || options.body || {},
      header: {
        'content-type': 'application/json',
        ...(options.header || {}),
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = res.data || {}
          if (data.success === false) {
            reject(new Error(data.message || '请求失败'))
            return
          }
          resolve(data)
          return
        }
        reject(new Error(`请求失败：${res.statusCode}`))
      },
      fail(err) { reject(err) },
    })
  })
}

function getCategories() { return request('/categories') }
function getWords(categoryId) { const query = categoryId ? `?categoryId=${categoryId}` : ''; return request(`/words${query}`) }
function login(type, username, password) { return request('/auth/login', { method: 'POST', body: { type, username, password } }) }

function getUserFavorites(userId) { return request(`/users/${userId}/favorites`) }
function addFavorite(payload) { return request('/favorites', { method: 'POST', body: payload }) }
function deleteFavorite(id) { return request(`/favorites/${id}`, { method: 'DELETE' }) }

function getUserSavedWords(userId) { return request(`/users/${userId}/saved-words`) }
function addSavedWord(payload) { return request('/saved-words', { method: 'POST', body: payload }) }
function deleteSavedWord(id) { return request(`/saved-words/${id}`, { method: 'DELETE' }) }

function getUserErrors(userId) { return request(`/users/${userId}/errors`) }
function addErrorWord(payload) { return request('/errors', { method: 'POST', body: payload }) }
function deleteErrorWord(id) { return request(`/errors/${id}`, { method: 'DELETE' }) }
function clearUserErrors(userId) { return request(`/users/${userId}/clear-errors`, { method: 'POST' }) }

function addStudyRecord(payload) { return request('/study-records', { method: 'POST', body: payload }) }

module.exports = {
  request,
  getUserStudyRecords,
  getCategories,
  getWords,
  login,
  getUserFavorites,
  addFavorite,
  deleteFavorite,
  getUserSavedWords,
  addSavedWord,
  deleteSavedWord,
  getUserErrors,
  addErrorWord,
  deleteErrorWord,
  clearUserErrors,
  addStudyRecord,
}
