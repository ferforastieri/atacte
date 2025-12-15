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
      class="relative max-w-sm w-full bg-white dark:bg-gray-800 rounded-[20px] shadow-sm border-l-[3px] py-2.5 px-4 flex items-center space-x-2.5"
      :class="borderColorClass"
      style="box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);"
    >
      <!-- Icon -->
      <div class="flex-shrink-0">
        <component
          :is="iconComponent"
          :class="iconColorClass"
          class="h-5 w-5"
        />
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
          {{ title }}
        </p>
        <p class="text-xs text-gray-600 dark:text-gray-400 leading-4">
          {{ message }}
        </p>
      </div>
      
      <!-- Close Button -->
      <div class="flex-shrink-0">
        <button
          @click="$emit('close')"
          class="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 dark:text-gray-400 focus:outline-none p-1"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
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

const emit = defineEmits<{
  close: []
}>()

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success':
      return CheckCircleIcon
    case 'error':
      return XCircleIcon
    case 'info':
      return InformationCircleIcon
    case 'warning':
      return ExclamationTriangleIcon
    default:
      return InformationCircleIcon
  }
})

const borderColorClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'border-l-[#10b981]'
    case 'error':
      return 'border-l-[#ef4444]'
    case 'info':
      return 'border-l-[#3b82f6]'
    case 'warning':
      return 'border-l-[#f59e0b]'
    default:
      return 'border-l-[#3b82f6]'
  }
})

const iconColorClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'text-[#10b981]'
    case 'error':
      return 'text-[#ef4444]'
    case 'info':
      return 'text-[#3b82f6]'
    case 'warning':
      return 'text-[#f59e0b]'
    default:
      return 'text-[#3b82f6]'
  }
})
</script>
