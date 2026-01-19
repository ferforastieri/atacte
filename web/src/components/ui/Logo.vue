<template>
  <div class="flex items-center space-x-2">
    <!-- Logo SVG -->
    <div class="flex-shrink-0">
      <svg 
        :width="size" 
        :height="size" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        class="transition-colors duration-200"
      >
        <!-- Círculo externo -->
        <circle 
          cx="16" 
          cy="16" 
          r="14" 
          :fill="isDark ? '#22c55e' : '#22c55e'" 
          :stroke="isDark ? '#15803d' : '#15803d'" 
          stroke-width="2"
        />
        
        <!-- Ícone de cadeado -->
        <path 
          d="M12 14v-2a4 4 0 1 1 8 0v2" 
          stroke="white" 
          stroke-width="2" 
          stroke-linecap="round"
        />
        <rect 
          x="10" 
          y="14" 
          width="12" 
          height="8" 
          rx="2" 
          ry="2" 
          fill="white"
        />
        
        <!-- Texto "S" -->
        <text 
          x="16" 
          y="26" 
          font-family="Arial, sans-serif" 
          font-size="8" 
          font-weight="bold" 
          text-anchor="middle" 
          :fill="isDark ? '#15803d' : '#15803d'"
        >
          S
        </text>
      </svg>
    </div>
    
    <!-- Texto do logo -->
    <span 
      v-if="showText" 
      :class="[
        'font-bold transition-colors duration-200',
        textColor || (isDark ? 'text-white' : 'text-gray-900'),
        textSize || 'text-xl'
      ]"
    >
      Sentro
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

interface Props {
  size?: number
  showText?: boolean
  textColor?: string
  textSize?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 32,
  showText: true,
  textColor: undefined,
  textSize: undefined
})

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDarkMode)
</script>
