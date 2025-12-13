<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Main App -->
    <router-view />
    
    <!-- Bottom Navigation removed - using hamburger menu instead -->
    
    <!-- Toast Container -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, getCurrentInstance } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/layout/ToastContainer.vue'

const authStore = useAuthStore()
const instance = getCurrentInstance()

onMounted(async () => {
  try {
    await authStore.initialize()
    
    
    if (authStore.isAuthenticated && instance?.appContext.config.globalProperties.$initApp) {
      await instance.appContext.config.globalProperties.$initApp()
    }
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error)
  }
})
</script>

<style>

</style>

