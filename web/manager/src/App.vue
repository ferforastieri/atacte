<template>
  <div id="app" class="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
    <TitleBar v-if="isElectron" />
    <div class="flex-1 overflow-x-hidden">
      <router-view />
    </div>
    
    <ToastContainer />
    <ReauthenticateModal />


  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ToastContainer from '@/components/layout/ToastContainer.vue'
import ReauthenticateModal from '@/components/auth/ReauthenticateModal.vue'
import TitleBar from '@/components/layout/TitleBar.vue'


const isElectron = computed(() => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  
  const ua = navigator.userAgent.toLowerCase()
  const isElectronUA = ua.includes('electron/')
  
  if (!isElectronUA) return false
  
  const electronAPI = (window as Window & { electronAPI?: {
    minimizeWindow?: () => void;
    maximizeWindow?: () => void;
    closeWindow?: () => void;
  } }).electronAPI
  if (!electronAPI) return false
  
  return typeof electronAPI.minimizeWindow === 'function' &&
         typeof electronAPI.maximizeWindow === 'function' &&
         typeof electronAPI.closeWindow === 'function'
})




</script>

<style>

</style>

