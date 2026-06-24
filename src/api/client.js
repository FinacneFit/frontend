const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

async function request(method, path, body = null, auth = true) {
  const isFormData = body instanceof FormData
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' }
  if (auth) {
    const token = localStorage.getItem('finfit_token')
    if (token) headers['Authorization'] = `Token ${token}`
  }

  const config = { method, headers }
  if (body !== null) config.body = isFormData ? body : JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, config)

  if (res.status === 204) return null

  const data = await res.json()
  if (!res.ok) {
    if (auth && res.status === 401) unauthorizedHandler?.()

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
  get:    (path, auth = true)               => request('GET',    path, null, auth),
  post:   (path, body = null, auth = true)  => request('POST',   path, body, auth),
  patch:  (path, body = null)               => request('PATCH',  path, body),
  delete: (path)                             => request('DELETE', path),
}
