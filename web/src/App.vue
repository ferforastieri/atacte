<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Main App -->
    <router-view />
    
    <!-- Bottom Navigation (Mobile only, authenticated users) -->
    <BottomNavigation v-if="authStore.isAuthenticated" />
    
    <!-- Toast Container -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, getCurrentInstance } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/layout/ToastContainer.vue'
import BottomNavigation from '@/components/layout/BottomNavigation.vue'

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
/* Estilos globais já estão no style.css */
</style>

