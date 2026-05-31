/**
 * Cliente HTTP para el backend. Añade Authorization: Bearer <token>
 * y ante 401 hace logout y redirige al login.
 */

// En desarrollo: siempre /api vía proxy de Vite (mismo origen, sin CORS). Producción: VITE_API_URL.
const rawUrl = String(import.meta.env.VITE_API_URL ?? '').trim()
const BASE_URL = (() => {
  if (import.meta.env.DEV) return ''
  if (!rawUrl) {
    // Mismo origen: Nginx proxy /api → backend
    return ''
  }
  return (rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`).replace(/\/+$/, '')
})()

const REQUEST_TIMEOUT_MS = 30000

let authStore = null
let router = null

export function setAuthStore(store) {
  authStore = store
}

export function setRouter(r) {
  router = r
}

function getHeaders(includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (includeAuth && authStore) {
    const t = authStore.token?.value ?? authStore.token
    if (t) headers.Authorization = `Bearer ${t}`
  }
  return headers
}

function parseErrorDetail(text) {
  try {
    const json = JSON.parse(text)
    const d = json.detail
    if (d == null) return null
    if (typeof d === 'string') return d
    if (Array.isArray(d)) return d.map((e) => e.msg || JSON.stringify(e)).join(', ')
    return String(d)
  } catch (_) {
    return text || null
  }
}

async function apiMultipartRequest(path, formData, { method = 'POST', auth = true } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const headers = { Accept: 'application/json' }
  if (auth && authStore) {
    const t = authStore.token?.value ?? authStore.token
    if (t) headers.Authorization = `Bearer ${t}`
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: formData,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return handleResponse(response, auth)
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('El servidor no respondió a tiempo.')
    }
    throw err
  }
}

async function handleResponse(response, requestAuth = true) {
  if (response.status === 401) {
    const text = await response.text()
    const fromServer = parseErrorDetail(text)
    const message = fromServer || 'Sesión expirada o no autorizado'
    if (authStore && requestAuth) {
      authStore.logout()
      if (router) {
        router.push({ name: 'login' })
      }
    }
    throw new Error(message)
  }
  if (!response.ok) {
    const text = await response.text()
    let detail = text
    try {
      const json = JSON.parse(text)
      detail = json.detail || (Array.isArray(json.detail) ? json.detail.map((e) => e.msg).join(', ') : json.detail) || text
    } catch (_) {}
    throw new Error(detail)
  }
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, auth = true } = options
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const config = {
    method,
    headers: getHeaders(auth),
  }
  if (body !== undefined && body !== null && method !== 'GET') {
    config.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  config.signal = controller.signal
  try {
    const response = await fetch(url, config)
    clearTimeout(timeoutId)
    return handleResponse(response, auth)
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('El servidor no respondió a tiempo. Comprueba que el backend esté en marcha y la URL en .env (VITE_API_URL).')
    }
    const errMsg = typeof err.message === 'string' ? err.message : ''
    if (
      errMsg === 'Failed to fetch' ||
      errMsg.includes('NetworkError') ||
      errMsg.includes('Load failed')
    ) {
      throw new Error(
        'No se pudo conectar al API. ¿Está uvicorn en marcha? En dev el proxy usa VITE_API_URL (o 127.0.0.1:8000). Reinicia npm run dev tras cambiar .env.'
      )
    }
    if (err.cause?.code === 'ECONNREFUSED') {
      throw new Error('No se pudo conectar al servidor. ¿Está el backend en marcha?')
    }
    throw err
  }
}

export const api = {
  get(path, options = {}) {
    return apiRequest(path, { ...options, method: 'GET' })
  },
  postMultipart(path, formData, options = {}) {
    return apiMultipartRequest(path, formData, { ...options, method: 'POST' })
  },
  post(path, body, options = {}) {
    return apiRequest(path, { ...options, method: 'POST', body })
  },
  patch(path, body, options = {}) {
    return apiRequest(path, { ...options, method: 'PATCH', body })
  },
  delete(path, options = {}) {
    return apiRequest(path, { ...options, method: 'DELETE' })
  },
}

export default api
