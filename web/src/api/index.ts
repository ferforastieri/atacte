import axios from 'axios'
import { useToast } from '@/hooks/useToast'
import { env } from '@/config/environment'

const api = axios.create({
  baseURL: env.apiUrl,
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
    const message = response.data?.message
    if (typeof message === 'string') {
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
            localStorage.removeItem('auth_token')
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
