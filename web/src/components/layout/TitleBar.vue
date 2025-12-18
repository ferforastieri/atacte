<template>
  <div 
    v-if="isElectron"
    class="title-bar fixed top-0 left-0 right-0 z-[100] flex items-center justify-between text-white h-8 select-none drag-region"
    style="-webkit-app-region: drag;"
  >
    <div class="flex items-center space-x-2 px-3 flex-1 min-w-0">
      <Logo :size="16" :show-text="false" />
      <span class="text-sm font-medium text-gray-300 truncate">Atacte</span>
    </div>
    
    <div class="flex items-center no-drag flex-shrink-0" style="-webkit-app-region: no-drag;">
      <button
        @click="minimize"
        class="title-bar-button w-8 h-8 flex items-center justify-center transition-colors"
        title="Minimizar"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 6h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
      
      <button
        @click="maximize"
        class="title-bar-button w-8 h-8 flex items-center justify-center transition-colors"
        title="Maximizar"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="8" height="8" stroke="currentColor" stroke-width="1.2" fill="none"/>
        </svg>
      </button>
      
      <button
        @click="close"
        class="title-bar-button w-8 h-8 flex items-center justify-center transition-colors"
        title="Fechar"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Logo from '@/components/ui/Logo.vue'

const isElectron = computed(() => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  
  try {
    const ua = navigator.userAgent.toLowerCase()
    const isElectronUA = ua.includes('electron/')
    
    if (!isElectronUA) return false
    
    const electronAPI = (window as any).electronAPI
    if (!electronAPI) return false
    
    const hasRequiredMethods = typeof electronAPI.minimizeWindow === 'function' &&
                               typeof electronAPI.maximizeWindow === 'function' &&
                               typeof electronAPI.closeWindow === 'function'
    
    return hasRequiredMethods === true
  } catch {
    return false
  }
})

const minimize = async () => {
  if ((window as any).electronAPI) {
    await (window as any).electronAPI.minimizeWindow()
  }
}

const maximize = async () => {
  if ((window as any).electronAPI) {
    await (window as any).electronAPI.maximizeWindow()
  }
}

const close = async () => {
  if ((window as any).electronAPI) {
    await (window as any).electronAPI.closeWindow()
  }
}
</script>

<style scoped>
.title-bar {
  background: #1e1f22;
  border-bottom: 1px solid rgba(34, 197, 94, 0.15);
  user-select: none;
}

.title-bar-button {
  color: #b9bbbe;
  border-radius: 4px;
}

.title-bar-button:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.1);
}

.title-bar-button:last-child:hover {
  background-color: #ef4444;
  color: #ffffff;
}

.drag-region {
  cursor: move;
}

.no-drag {
  cursor: default;
}
</style>

