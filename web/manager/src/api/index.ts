import axios from 'axios'
import { useToast } from '@/hooks/useToast'
import { env } from '@/config/environment'

const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

function getCsrfToken(): string | undefined {
  return document.cookie.split('; ').find((part) => part.startsWith('atacte_csrf='))?.split('=').slice(1).join('=')
}

async function getClientCsrfToken(): Promise<string | undefined> {
  const localToken = getCsrfToken()
  if (localToken) return decodeURIComponent(localToken)
  const electronToken = await window.electronAPI?.getCsrfToken?.()
  return electronToken || undefined
}

let csrfRequest: Promise<void> | null = null
async function ensureCsrfToken() {
  if (getCsrfToken()) return
  csrfRequest ??= api.get('/auth/csrf').then(() => undefined).finally(() => { csrfRequest = null })
  await csrfRequest
}


api.interceptors.request.use(
  async (config) => {
    const method = config.method?.toUpperCase() ?? 'GET'
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !config.url?.endsWith('/auth/csrf')) {
      await ensureCsrfToken()
      const csrf = await getClientCsrfToken()
      if (csrf) config.headers['X-CSRF-Token'] = csrf
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)


api.interceptors.response.use(
  (response) => {
    const message = response.data?.message
    if (response.config.method?.toLowerCase() !== 'get' && typeof message === 'string') {
      useToast().success(message)
    }
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      if (typeof data?.message === 'string') {
        useToast().error(data.message)
      }
      
      switch (status) {
        case 401:
          if (data.requiresTrust && data.sessionId) {
            const event = new CustomEvent('device-trust-required', {
              detail: {
                sessionId: data.sessionId,
                deviceName: data.deviceName,
                ipAddress: data.ipAddress
              }
            })
            window.dispatchEvent(event)
            return Promise.reject(error)
          }
          
          if (!error.config.url?.includes('/auth/me') && 
              !error.config.url?.includes('/auth/trust-device') &&
              !error.config.url?.includes('/preferences')) {
            localStorage.removeItem('user')
            window.location.href = '/login'
          }
          break
          
        case 403:
          if (data.requiresTrust && data.sessionId) {
            const event = new CustomEvent('device-trust-required', {
              detail: {
                sessionId: data.sessionId,
                deviceName: data.deviceName,
                ipAddress: data.ipAddress
              }
            })
            window.dispatchEvent(event)
            return Promise.reject(error)
          }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api


export { default as authApi } from './auth'
export { default as passwordsApi } from './passwords'
export { default as totpApi } from './totp'
export { default as usersApi } from './users'
