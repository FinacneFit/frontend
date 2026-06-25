const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

const ACCESS_KEY = 'finfit_access'
const REFRESH_KEY = 'finfit_refresh'

let unauthorizedHandler = null
let tokenUpdateHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export function setTokenUpdateHandler(handler) {
  tokenUpdateHandler = handler
}

async function tryRefreshToken() {
  const refresh = localStorage.getItem(REFRESH_KEY)
  if (!refresh) return null

  try {
    const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) return null
    const { access } = await res.json()
    localStorage.setItem(ACCESS_KEY, access)
    tokenUpdateHandler?.(access)
    return access
  } catch {
    return null
  }
}

async function request(method, path, body = null, auth = true) {
  const isFormData = body instanceof FormData
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' }

  if (auth) {
    const token = localStorage.getItem(ACCESS_KEY)
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const config = { method, headers }
  if (body !== null) config.body = isFormData ? body : JSON.stringify(body)

  let res = await fetch(`${BASE_URL}${path}`, config)

  if (res.status === 401 && auth) {
    const newToken = await tryRefreshToken()
    if (newToken) {
      const retryHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` }
      res = await fetch(`${BASE_URL}${path}`, { ...config, headers: retryHeaders })
    } else {
      unauthorizedHandler?.()
      const err = new Error('인증이 필요합니다.')
      err.status = 401
      throw err
    }
  }

  if (res.status === 204) return null

  const data = await res.json()
  if (!res.ok) {
    const message =
      data?.detail ||
      data?.non_field_errors?.[0] ||
      Object.values(data)?.[0]?.[0] ||
      '오류가 발생했습니다.'
    throw new Error(message)
  }
  return data
}

export const client = {
  get:    (path, auth = true)              => request('GET',    path, null, auth),
  post:   (path, body = null, auth = true) => request('POST',   path, body, auth),
  patch:  (path, body = null)              => request('PATCH',  path, body),
  delete: (path)                           => request('DELETE', path),
}
