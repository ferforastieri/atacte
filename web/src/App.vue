<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Main App -->
    <router-view />
    
    <!-- Bottom Navigation removed - using hamburger menu instead -->
    
    <!-- Toast Container -->
    <ToastContainer />

    <!-- Trust Device Modal -->
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
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/layout/ToastContainer.vue'
import TrustDeviceModal from '@/components/auth/TrustDeviceModal.vue'

const authStore = useAuthStore()
const router = useRouter()
const instance = getCurrentInstance()

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
  window.location.reload()
}

onMounted(async () => {
  try {
    await authStore.initialize()
    
    
    if (authStore.isAuthenticated && instance?.appContext.config.globalProperties.$initApp) {
      await instance.appContext.config.globalProperties.$initApp()
    }

    window.addEventListener('device-trust-required', handleDeviceTrustRequired as EventListener)
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('device-trust-required', handleDeviceTrustRequired as EventListener)
})
</script>

<style>

</style>

