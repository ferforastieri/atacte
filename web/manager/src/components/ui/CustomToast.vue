<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-pop"
      role="status"
      aria-live="polite"
    >
      <span class="absolute inset-y-0 left-0 w-1" :class="accentClass" aria-hidden="true"></span>

      <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" :class="tileClass">
        <component :is="iconComponent" class="h-5 w-5" aria-hidden="true" />
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-ink">{{ title }}</p>
        <p class="mt-0.5 text-xs leading-relaxed text-ink-muted">{{ message }}</p>
      </div>

      <button
        type="button"
        class="rounded-lg p-1 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label="Fechar aviso"
        @click="$emit('close')"
      >
        <XMarkIcon class="h-4 w-4" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

interface Props {
  show: boolean
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success':
      return CheckCircleIcon
    case 'error':
      return XCircleIcon
    case 'warning':
      return ExclamationTriangleIcon
    default:
      return InformationCircleIcon
  }
})

const accentClass = computed(() => {
  const classes = {
    success: 'bg-success-500',
    error: 'bg-danger-500',
    info: 'bg-info-500',
    warning: 'bg-warning-500'
  }
  return classes[props.type]
})

const tileClass = computed(() => {
  const classes = {
    success: 'bg-success-50 text-success-700 dark:bg-success-900/40 dark:text-success-300',
    error: 'bg-danger-50 text-danger-600 dark:bg-danger-900/40 dark:text-danger-300',
    info: 'bg-info-50 text-info-600 dark:bg-info-900/40 dark:text-info-300',
    warning: 'bg-warning-50 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300'
  }
  return classes[props.type]
})
</script>
