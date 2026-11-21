<template>
  <div class="hero-card p-4 sm:p-5">
    <div class="hero-glow"></div>

    <div class="relative">
      <div class="flex items-center justify-between gap-3">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Código atual</span>
        <span class="pill bg-white/10 text-gray-200">{{ currentTimeRemaining }}s</span>
      </div>

      <p
        class="mono-secret mt-2 text-center text-3xl font-bold tracking-[0.22em] text-white sm:text-4xl"
        :class="{ 'animate-pulse': currentTimeRemaining < 5 }"
      >
        {{ formattedCode }}
      </p>

      <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          class="h-full rounded-full bg-primary-500 transition-all duration-1000 ease-linear"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>

      <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-40"
          :disabled="isRefreshing"
          @click="refreshCode"
        >
          <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': isRefreshing }" />
          Atualizar
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-40"
          :disabled="displayCode === '------' || isCopying"
          @click="copyCode"
        >
          <CheckIcon v-if="copied" class="h-4 w-4 text-primary-400" />
          <ClipboardIcon v-else class="h-4 w-4" />
          {{ copied ? 'Copiado' : 'Copiar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ArrowPathIcon, CheckIcon, ClipboardIcon } from '@heroicons/vue/24/outline'
import { TOTPClient } from '@/utils/totpClient'
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

const isRefreshing = ref(false)
const isCopying = ref(false)
const copied = ref(false)
let copiedTimeout: ReturnType<typeof setTimeout> | null = null
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
  } catch {
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

const progress = computed(() => {
  return Math.max(0, Math.min(100, (displayTimeRemaining.value / displayPeriod.value) * 100))
})

const copyCode = async () => {
  if (!displayCode.value || displayCode.value === '------') return

  const cleanCode = displayCode.value.replace(/\D/g, '').slice(0, 6)
  if (cleanCode.length !== 6) {
    return
  }

  isCopying.value = true
  const result = await copyToClipboard(cleanCode)
  isCopying.value = false

  if (!result.success) return

  copied.value = true
  if (copiedTimeout) clearTimeout(copiedTimeout)
  copiedTimeout = setTimeout(() => {
    copied.value = false
  }, 2000)
}

const refreshCode = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true

  if (props.secret) {
    generateTotpCode()
  } else {
    emit('refresh')
  }

  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}

const startTimer = () => {
  if (intervalId) return

  intervalId = window.setInterval(() => {
    if (props.secret) {
      generateTotpCode()
    } else if (displayTimeRemaining.value <= 1) {
      emit('refresh')
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
  if (copiedTimeout) clearTimeout(copiedTimeout)
})
</script>
