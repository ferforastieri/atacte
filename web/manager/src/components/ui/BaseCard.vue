<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <slot name="header" />
    </div>
    
    <div :class="bodyClasses">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  overflowVisible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  hover: false,
  overflowVisible: false
})

const cardClasses = computed(() => {
  const overflowClass = props.overflowVisible ? 'overflow-visible' : 'overflow-hidden'
  const baseClasses = `bg-white dark:bg-gray-800 rounded-lg ${overflowClass} transition-colors duration-200`
  
  const variantClasses = {
    default: 'shadow-sm border border-gray-200 dark:border-gray-700',
    elevated: 'shadow-lg border border-gray-100 dark:border-gray-600',
    outlined: 'border-2 border-gray-200 dark:border-gray-700'
  }
  
  const hoverClasses = props.hover 
    ? 'transition-all duration-200 hover:shadow-md dark:hover:shadow-lg' 
    : ''
  
  return [
    baseClasses,
    variantClasses[props.variant],
    hoverClasses
  ].join(' ')
})

const bodyClasses = computed(() => {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }
  
  return paddingClasses[props.padding]
})
</script>

