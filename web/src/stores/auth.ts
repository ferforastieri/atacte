import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import authApi, { type User, type LoginRequest, type RegisterRequest } from '@/api/auth'
import preferencesApi from '@/api/preferences'

export const useAuthStore = defineStore('auth', () => {
  
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const userPreferences = ref<any>(null)

  
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userId = computed(() => user.value?.id || '')
  const userRole = computed(() => user.value?.role || 'USER')
  const isAdmin = computed(() => userRole.value === 'ADMIN')

  
  const setAuth = (newToken: string, newUser: User) => {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    userPreferences.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  }

  const loadUserPreferences = async () => {
    if (!isAuthenticated.value) return null
    
    try {
      const response = await preferencesApi.getPreferences()
      if (response.success && response.data) {
        userPreferences.value = response.data
        return response.data
      }
    } catch (error) {
    }
    
    return null
  }

  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser && token.value) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (error) {
        clearAuth()
      }
    }
  }

  const login = async (credentials: LoginRequest) => {
    isLoading.value = true
    try {
      const response = await authApi.login(credentials)
      if (response.success && response.data) {
        if (response.data.token && response.data.user) {
          setAuth(response.data.token, response.data.user)
          if (!response.data.requiresTrust) {
            await loadUserPreferences()
          }
        }
        return response
      }
      throw new Error(response.message || 'Erro no login')
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterRequest) => {
    isLoading.value = true
    try {
      const response = await authApi.register(userData)
      if (response.success) {
        return response
      }
      throw new Error(response.message || 'Erro no registro')
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    try {
      await authApi.logout()
    } catch (error) {
      
    } finally {
      clearAuth()
      isLoading.value = false
    }
  }

  const verifyToken = async () => {
    if (!token.value) return false
    
    try {
      const response = await authApi.verifyToken()
      if (response.success && response.data) {
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        return true
      }
    } catch (error) {
      clearAuth()
    }
    
    return false
  }

  
  const initialize = async () => {
    loadUserFromStorage()
    
    
    if (token.value) {
      try {
        const isValid = await verifyToken()
        if (!isValid) {
          clearAuth()
        } else {
          
          await loadUserPreferences()
        }
      } catch (error) {
        clearAuth()
      }
    }
  }

  return {
    
    user,
    token,
    isLoading,
    userPreferences,
    
    
    isAuthenticated,
    userEmail,
    userId,
    userRole,
    isAdmin,
    
    
    setAuth,
    clearAuth,
    login,
    register,
    logout,
    verifyToken,
    loadUserPreferences,
    initialize
  }
})
