const API_BASE = '/api'

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  let data = null
  try {
    data = await response.json()
  } catch (error) {
    data = null
  }

  if (!response.ok) {
    throw new Error((data && data.message) || `请求失败(${response.status})`)
  }
  if (data && data.success === false) {
    throw new Error(data.message || '请求失败')
  }
  return data
}
