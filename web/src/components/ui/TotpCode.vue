<template>
  <div class="totp-container">
    <div class="totp-code-wrapper">
      <div class="totp-code" :class="{ 'animate-pulse': currentTimeRemaining < 5 }">
        {{ formattedCode }}
      </div>
      
      <div class="totp-timer-container">
        <div class="totp-timer" :style="timerStyle">
          <div class="totp-timer-inner">
            {{ currentTimeRemaining }}s
          </div>
        </div>
      </div>
    </div>
    
    <div class="totp-actions">
      <BaseButton
        variant="ghost"
        size="sm"
        @click="copyCode"
        :disabled="!currentCode"
      >
        <ClipboardIcon class="w-4 h-4 mr-1" />
        Copiar
      </BaseButton>
      
      <BaseButton
        variant="ghost"
        size="sm"
        @click="refreshCode"
        :loading="isRefreshing"
      >
        <ArrowPathIcon class="w-4 h-4 mr-1" />
        Atualizar
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useToast } from '@/hooks/useToast'
import { ClipboardIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import BaseButton from './BaseButton.vue'
import { TOTPClient, type TOTPCode } from '@/utils/totpClient'
import { copyToClipboard } from '@/utils/clipboard'

interface Props {
  secret?: string | null 
  code?: string | null 
  timeRemaining?: number | null 
  period?: number | null 
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true
})

const emit = defineEmits<{
  refresh: []
}>()

const toast = useToast()
const isRefreshing = ref(false)
let intervalId: number | null = null


const currentCode = ref<string>('')
const currentTimeRemaining = ref<number>(30)
const currentPeriod = ref<number>(30)


const generateTotpCode = () => {
  if (!props.secret) {
    return
  }
  
  try {
    const totpData = TOTPClient.generateCurrentCode(props.secret)
    currentCode.value = totpData.code
    currentTimeRemaining.value = totpData.timeRemaining
    currentPeriod.value = totpData.period
  } catch (error) {
    currentCode.value = '------'
  }
}


const displayCode = computed(() => {
  return currentCode.value || props.code || '------'
})

const displayTimeRemaining = computed(() => {
  return currentTimeRemaining.value || props.timeRemaining || 30
})

const displayPeriod = computed(() => {
  return currentPeriod.value || props.period || 30
})

const formattedCode = computed(() => {
  if (!displayCode.value || displayCode.value === '------') return '------'
  return displayCode.value.replace(/(.{3})/g, '$1 ').trim()
})

const timerStyle = computed(() => {
  const progress = (displayTimeRemaining.value / displayPeriod.value) * 100
  return {
    '--progress': `${progress * 3.6}deg`
  }
})

const copyCode = async () => {
  if (!displayCode.value || displayCode.value === '------') return

  const cleanCode = displayCode.value.replace(/\D/g, '').slice(0, 6)
  if (cleanCode.length !== 6) {
    toast.error('Código indisponível')
    return
  }
  
  const result = await copyToClipboard(cleanCode)
  if (result.success) {
    toast.success('Código copiado!')
  } else {
    toast.error(result.message)
  }
}

const refreshCode = async () => {
  isRefreshing.value = true
  
  
  if (props.secret) {
    generateTotpCode()
  } else {
    
    emit('refresh')
  }
  
  setTimeout(() => {
    isRefreshing.value = false
  }, 1000)
}

const startTimer = () => {
  if (intervalId) return
  
  intervalId = window.setInterval(() => {
    if (props.secret) {
      
      generateTotpCode()
    } else {
      
      if (displayTimeRemaining.value <= 1) {
        emit('refresh')
      }
    }
  }, 1000)
}

const stopTimer = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}


watch(() => props.secret, (newSecret) => {
  if (newSecret) {
    generateTotpCode()
  }
}, { immediate: true })

onMounted(() => {
  if (props.secret) {
    generateTotpCode()
  }
  
  if (props.autoRefresh) {
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.totp-container {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4;
}

.totp-code-wrapper {
  @apply relative;
}

.totp-code {
  @apply font-mono text-3xl font-bold text-center text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 rounded-lg py-4 px-6 border-2 border-dashed border-gray-300 dark:border-gray-600 tracking-widest;
}

.totp-timer-container {
  @apply absolute -top-2 -right-2;
}

.totp-timer {
  @apply w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center;
  background: conic-gradient(from 0deg, #3b82f6 0deg, #3b82f6 var(--progress), #e5e7eb var(--progress), #e5e7eb 360deg);
}

.totp-timer-inner {
  @apply w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200;
}

.totp-actions {
  @apply flex justify-center space-x-2;
}
</style>
