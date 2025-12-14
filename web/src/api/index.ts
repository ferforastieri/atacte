import axios from 'axios'
import { useToast } from '@/hooks/useToast'
import config from '@/config/environment'


const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)


api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const toast = useToast()
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          
          
          if (!error.config.url?.includes('/auth/me')) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
            window.location.href = '/login'
            toast.error('Sessão expirada. Faça login novamente.')
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
          toast.error(data.message || 'Acesso negado.')
          break
          
        case 404:
          toast.error('Recurso não encontrado.')
          break
          
        case 422:
          
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((err: any) => {
              toast.error(err.message || err)
            })
          } else {
            toast.error(data.message || 'Dados inválidos.')
          }
          break
          
        case 429:
          toast.error('Muitas tentativas. Tente novamente em alguns minutos.')
          break
          
        case 500:
          toast.error('Erro interno do servidor.')
          break
          
        default:
          toast.error(data.message || 'Erro inesperado.')
      }
    } else if (error.request) {
      
      toast.error('Erro de conexão. Verifique sua internet.')
    } else {
      
      toast.error('Erro inesperado.')
    }
    
    return Promise.reject(error)
  }
)

export default api


export { default as authApi } from './auth'
export { default as passwordsApi } from './passwords'
export { default as totpApi } from './totp'
export { default as usersApi } from './users'
