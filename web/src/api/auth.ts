import api from './index'


export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
  role: 'USER' | 'ADMIN'
  isActive?: boolean
  name?: string
  phoneNumber?: string
}

export interface LoginRequest {
  email: string
  masterPassword: string
  deviceName?: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  email: string
  masterPassword: string
}

export interface Session {
  id: string
  deviceName?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  lastUsed: string
  expiresAt: string
  isTrusted?: boolean
  isCurrent?: boolean
}


const authApi = {
  
  async login(credentials: LoginRequest) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  
  async register(userData: RegisterRequest) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  
  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  },

  
  async verifyToken() {
    const response = await api.get('/auth/me')
    return response.data
  },

  
  async getSessions() {
    const response = await api.get('/auth/sessions')
    return response.data
  },

  
  async revokeSession(sessionId: string) {
    const response = await api.delete(`/auth/sessions/${sessionId}`)
    return response.data
  },

  async requestPasswordReset(email: string) {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  async resetPassword(token: string, newPassword: string) {
    const response = await api.post('/auth/reset-password', { token, newPassword })
    return response.data
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword })
    return response.data
  },

  async trustDevice(sessionId: string) {
    const response = await api.post('/auth/trust-device', { sessionId })
    return response.data
  },

  async untrustDevice(deviceName: string) {
    const response = await api.post('/auth/untrust-device', { deviceName })
    return response.data
  }
}

export default authApi

