<template>
  <div id="app" class="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
    <TitleBar v-if="isElectron" />
    <div class="flex-1 overflow-x-hidden">
      <router-view />
    </div>
    
    <ToastContainer />

    <TrustDeviceModal
      :show="showTrustModal"
      :session-id="trustSessionId"
      :device-name="trustDeviceName"
      :ip-address="trustIpAddress"
      @close="handleTrustModalClose"
      @trusted="handleDeviceTrusted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/layout/ToastContainer.vue'
import TrustDeviceModal from '@/components/auth/TrustDeviceModal.vue'
import TitleBar from '@/components/layout/TitleBar.vue'

const authStore = useAuthStore()
const router = useRouter()
const instance = getCurrentInstance()

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

const showTrustModal = ref(false)
const trustSessionId = ref('')
const trustDeviceName = ref('')
const trustIpAddress = ref('')

const handleDeviceTrustRequired = (event: CustomEvent) => {
  trustSessionId.value = event.detail.sessionId
  trustDeviceName.value = event.detail.deviceName || 'Desconhecido'
  trustIpAddress.value = event.detail.ipAddress || 'Desconhecido'
  showTrustModal.value = true
}

const handleTrustModalClose = () => {
  showTrustModal.value = false
  authStore.logout()
  router.push('/login')
}

const handleDeviceTrusted = async () => {
  showTrustModal.value = false
  
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const currentPath = router.currentRoute.value.path
  if (currentPath === '/login') {
    router.push('/dashboard')
  }
}

onMounted(async () => {
  try {
    await authStore.initialize()
    
    if (authStore.isAuthenticated && instance?.appContext.config.globalProperties.$initApp) {
      await instance.appContext.config.globalProperties.$initApp()
    }

    window.addEventListener('device-trust-required', handleDeviceTrustRequired as EventListener)
  } catch (error) {
  }
})

onUnmounted(() => {
  window.removeEventListener('device-trust-required', handleDeviceTrustRequired as EventListener)
})
</script>

<style>

</style>

