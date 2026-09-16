import axios from 'axios'
import { useToast } from '@/hooks/useToast'
import { env } from '@/config/environment'

let sessionGeneration = 0
export function invalidatePendingRequests() { sessionGeneration++ }
const requestGeneration = new WeakMap<object, number>()

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
    requestGeneration.set(config, sessionGeneration)
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


let reauthentication: Promise<boolean> | null = null

api.interceptors.response.use(
  (response) => {
    if (requestGeneration.get(response.config) !== sessionGeneration) {
      return Promise.reject(new axios.CanceledError('Sessão encerrada'))
    }
    const message = response.data?.message
    if (response.config.method?.toLowerCase() !== 'get' && response.config.headers?.['X-Silent-Toast'] !== 'true' && typeof message === 'string') {
      useToast().success(message)
    }
    return response
  },
  async (error) => {
    if (error.config && requestGeneration.get(error.config) !== sessionGeneration) {
      return Promise.reject(new axios.CanceledError('Sessão encerrada'))
    }
    if (error.response) {
      const { status, data } = error.response
      if (status === 403 && data?.requiresReauthentication && !error.config?._securityRetry) {
        reauthentication ??= new Promise<boolean>(resolve => { window.dispatchEvent(new CustomEvent('reauthentication-required', { detail: resolve })) }).finally(() => { reauthentication = null })
        if (await reauthentication) return api({ ...error.config, _securityRetry: true })
        return Promise.reject(error)
      }

      if (error.config?.headers?.['X-Silent-Toast'] !== 'true' && typeof data?.message === 'string') {
        useToast().error(data.message)
      }
      
      switch (status) {
        case 401:

          
          if (!error.config.url?.includes('/auth/me') && 
              !error.config.url?.includes('/preferences')) {
            localStorage.removeItem('user')
            window.location.href = '/login'
          }
          break
          
        case 403:

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
