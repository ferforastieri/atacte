import type { App } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePasswordsStore } from '@/stores/passwords'

export default {
  install(app: App) {
    
    app.config.globalProperties.$initApp = async () => {
      const authStore = useAuthStore()
      const passwordsStore = usePasswordsStore()
      
      try {
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!authStore.isAuthenticated) {
          return false
        }
        
        
        await Promise.all([
          passwordsStore.fetchPasswords(),
          passwordsStore.fetchFolders()
        ])
        
        return true
        
      } catch (error) {
        throw error
      }
    }
  }
}
