import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import passwordsApi, { type PasswordEntry, type CreatePasswordRequest, type UpdatePasswordRequest, type PasswordSearchFilters } from '@/api/passwords'
import importExportApi from '@/api/importExport'
import totpApi, { type TOTPCode } from '@/api/totp'

export const usePasswordsStore = defineStore('passwords', () => {
  
  const passwords = ref<PasswordEntry[]>([])
  const currentPassword = ref<PasswordEntry | null>(null)
  const folders = ref<string[]>([])
  const isLoading = ref(false)
  const pagination = ref({
    total: 0,
    limit: 50,
    offset: 0,
    currentPage: 1
  })
  const searchFilters = ref<PasswordSearchFilters>({
    query: '',
    folder: '',
    limit: 50,
    offset: 0,
    sortBy: 'name',
    sortOrder: 'asc'
  })

  
  const favoritePasswords = computed(() => 
    passwords.value.filter(p => p.isFavorite)
  )

  
  const allFavoritePasswords = ref<PasswordEntry[]>([])
  const allTotpEnabledPasswords = ref<PasswordEntry[]>([])
  const statsLoaded = ref(false)

  const passwordsByFolder = computed(() => {
    const grouped = passwords.value.reduce((acc, password) => {
      const folder = password.folder || 'Sem pasta'
      if (!acc[folder]) {
        acc[folder] = []
      }
      acc[folder].push(password)
      return acc
    }, {} as Record<string, PasswordEntry[]>)
    
    return Object.entries(grouped).map(([folder, passwords]) => ({
      folder,
      passwords,
      count: passwords.length
    }))
  })

  const totalCount = computed(() => pagination.value.total)

  
  const searchResults = computed(() => passwords.value)

  
  const fetchPasswords = async (filters?: Partial<PasswordSearchFilters>) => {
    isLoading.value = true
    try {
      const currentFilters = { ...searchFilters.value, ...filters }
      const response = await passwordsApi.searchPasswords(currentFilters)
      
      if (response.success) {
        passwords.value = response.data
        
        if (response.pagination) {
          pagination.value = {
            total: response.pagination.total,
            limit: response.pagination.limit,
            offset: response.pagination.offset,
            currentPage: Math.floor(response.pagination.offset / response.pagination.limit) + 1
          }
        }
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar senhas')
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchPasswordById = async (id: string) => {
    isLoading.value = true
    try {
      const response = await passwordsApi.getPasswordById(id)
      if (response.success) {
        currentPassword.value = response.data
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar senha')
    } finally {
      isLoading.value = false
    }
  }

  const createPassword = async (passwordData: CreatePasswordRequest) => {
    isLoading.value = true
    try {
      const response = await passwordsApi.createPassword(passwordData)
      if (response.success) {
        passwords.value.push(response.data)
        await fetchFolders() 
        return response.data
      }
      throw new Error(response.message || 'Erro ao criar senha')
    } finally {
      isLoading.value = false
    }
  }

  const updatePassword = async (id: string, passwordData: UpdatePasswordRequest) => {
    isLoading.value = true
    try {
      
      const { totpEnabled, totpSecret, ...passwordFields } = passwordData
      
      
      const response = await passwordsApi.updatePassword(id, passwordFields)
      
      if (response.success) {
        
        if (totpEnabled && totpSecret) {
          
          await addTotp(id, totpSecret)
        } else if (totpEnabled === false) {
          
          await removeTotp(id)
        }
        
        
        const index = passwords.value.findIndex(p => p.id === id)
        if (index !== -1) {
          passwords.value[index] = response.data
        }
        if (currentPassword.value?.id === id) {
          currentPassword.value = response.data
        }
        await fetchFolders() 
        return response.data
      }
      throw new Error(response.message || 'Erro ao atualizar senha')
    } finally {
      isLoading.value = false
    }
  }

  const deletePassword = async (id: string) => {
    isLoading.value = true
    try {
      const response = await passwordsApi.deletePassword(id)
      if (response.success) {
        passwords.value = passwords.value.filter(p => p.id !== id)
        if (currentPassword.value?.id === id) {
          currentPassword.value = null
        }
        await fetchFolders() 
        return response.data
      }
      throw new Error(response.message || 'Erro ao deletar senha')
    } finally {
      isLoading.value = false
    }
  }

  const fetchFolders = async () => {
    try {
      const response = await passwordsApi.searchPasswords({})
      if (response.success) {
        const foldersSet = new Set<string>()
        response.data.forEach((password: PasswordEntry) => {
          if (password.folder) {
            foldersSet.add(password.folder)
          }
        })
        folders.value = Array.from(foldersSet).sort()
      }
    } catch (error) {
    }
  }

  const generatePassword = async (options: Partial<{
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
  }> = {}) => {
    try {
      const response = await passwordsApi.generatePassword(options)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Erro ao gerar senha')
    } catch (error) {
      throw error
    }
  }

  
  const getTotpCode = async (id: string) => {
    try {
      const response = await totpApi.getTotpCode(id)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar código TOTP')
    } catch (error) {
      throw error
    }
  }

  
  const getTotpSecret = async (id: string) => {
    try {
      const response = await totpApi.getTotpSecret(id)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar secret TOTP')
    } catch (error) {
      throw error
    }
  }

  const addTotp = async (id: string, totpInput: string) => {
    isLoading.value = true
    try {
      const response = await totpApi.addTotpToPassword(id, totpInput)
      if (response.success) {
        
        const index = passwords.value.findIndex(p => p.id === id)
        if (index !== -1) {
          passwords.value[index] = response.data
        }
        if (currentPassword.value?.id === id) {
          currentPassword.value = response.data
        }
        return response.data
      }
      throw new Error(response.message || 'Erro ao adicionar TOTP')
    } finally {
      isLoading.value = false
    }
  }

  const removeTotp = async (id: string) => {
    isLoading.value = true
    try {
      const response = await totpApi.removeTotpFromPassword(id)
      if (response.success) {
        
        const index = passwords.value.findIndex(p => p.id === id)
        if (index !== -1) {
          passwords.value[index] = response.data
        }
        if (currentPassword.value?.id === id) {
          currentPassword.value = response.data
        }
        return response.data
      }
      throw new Error(response.message || 'Erro ao remover TOTP')
    } finally {
      isLoading.value = false
    }
  }

  
  const importPasswords = async (jsonData: {
    encrypted?: boolean;
    folders?: Array<unknown>;
    items?: Array<unknown>;
  }) => {
    isLoading.value = true
    try {
      const response = await importExportApi.importPasswords(jsonData)
      if (response.success) {
        
        await fetchPasswords()
        await fetchFolders()
        return response.data
      }
      throw new Error(response.message || 'Erro ao importar senhas')
    } finally {
      isLoading.value = false
    }
  }

  
  const exportToBitwarden = async () => {
    try {
      const result = await importExportApi.exportToBitwarden()
      return result
    } catch (error) {
      throw error
    }
  }

  const exportToCSV = async () => {
    try {
      const result = await importExportApi.exportToCSV()
      return result
    } catch (error) {
      throw error
    }
  }

  
  const loadCompleteStats = async () => {
    try {
      
      const favoritesResponse = await passwordsApi.searchPasswords({
        isFavorite: true,
        limit: 1000, 
        offset: 0
      })
      
      if (favoritesResponse.success) {
        allFavoritePasswords.value = favoritesResponse.data
      }

      
      const totpResponse = await passwordsApi.searchPasswords({
        totpEnabled: true,
        limit: 1000, 
        offset: 0
      })
      
      if (totpResponse.success) {
        allTotpEnabledPasswords.value = totpResponse.data
      }

      statsLoaded.value = true
    } catch (error) {
    }
  }

  
  const setSearchFilters = (filters: Partial<PasswordSearchFilters>) => {
    searchFilters.value = { ...searchFilters.value, ...filters }
  }

  const clearSearch = () => {
    searchFilters.value = {
      query: '',
      folder: '',
      limit: 50,
      offset: 0,
      sortBy: 'name',
      sortOrder: 'asc'
    }
  }

  const clearCurrentPassword = () => {
    currentPassword.value = null
  }

  
  const goToPage = async (page: number) => {
    const newOffset = (page - 1) * pagination.value.limit
    await fetchPasswords({ offset: newOffset })
  }

  const nextPage = async () => {
    const totalPages = Math.ceil(pagination.value.total / pagination.value.limit)
    if (pagination.value.currentPage < totalPages) {
      await goToPage(pagination.value.currentPage + 1)
    }
  }

  const previousPage = async () => {
    if (pagination.value.currentPage > 1) {
      await goToPage(pagination.value.currentPage - 1)
    }
  }

  const setPageSize = async (size: number) => {
    await fetchPasswords({ limit: size, offset: 0 })
  }


  return {
    
    passwords,
    currentPassword,
    folders,
    isLoading,
    searchFilters,
    pagination,
    
    
    favoritePasswords,
    passwordsByFolder,
    totalCount,
    searchResults,
    
    
    allFavoritePasswords,
    allTotpEnabledPasswords,
    statsLoaded,
    loadCompleteStats,
    
    
    fetchPasswords,
    fetchPasswordById,
    createPassword,
    updatePassword,
    deletePassword,
    fetchFolders,
    generatePassword,
    
    
    getTotpCode,
    getTotpSecret,
    addTotp,
    removeTotp,
    
    
    importPasswords,
    
    
    exportToBitwarden,
    exportToCSV,
    
    
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    
    
    setSearchFilters,
    clearSearch,
    clearCurrentPassword
  }
})
