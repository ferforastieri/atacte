<template>
  <div class="flex items-center space-x-2">
    <img
      :src="symbolUrl"
      :width="size"
      :height="size"
      :alt="showText ? '' : 'Atacte'"
      :aria-hidden="showText ? 'true' : undefined"
      class="flex-shrink-0 object-contain"
    />

    <span
      v-if="showText"
      :class="[
        'font-bold transition-colors duration-200',
        textColor || (isDark ? 'text-white' : 'text-ink'),
        textSize || 'text-xl'
      ]"
    >
      Atacte
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
const symbolUrl = `${import.meta.env.BASE_URL}atacte-symbol.png`
</script>
