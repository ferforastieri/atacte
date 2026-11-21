<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <span
      v-if="loading"
      class="mr-2 h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    ></span>
    <component
      v-else-if="icon"
      :is="icon"
      class="mr-2 h-4 w-4 flex-shrink-0"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'subtle' | 'dark'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  icon?: string | Component
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50'

  const variantClasses = {
    primary: 'bg-primary-700 text-white shadow-sm hover:bg-primary-800 active:bg-primary-900',
    secondary: 'border border-line bg-surface text-ink shadow-sm hover:border-line-strong hover:bg-surface-muted',
    danger: 'bg-danger-600 text-white shadow-sm hover:bg-danger-700 active:bg-danger-700',
    ghost: 'border border-transparent bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink',
    subtle: 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/60',
    dark: 'bg-gray-900 text-white shadow-sm ring-1 ring-white/10 hover:bg-gray-800'
  }

  const sizeClasses = {
    sm: 'gap-1 px-3 py-1.5 text-xs',
    md: 'gap-1 px-4 py-2 text-sm',
    lg: 'gap-2 px-5 py-2.5 text-base',
    icon: 'h-10 w-10 p-0'
  }

  return [
    baseClasses,
    variantClasses[props.variant],
    sizeClasses[props.size],
    props.block ? 'w-full' : ''
  ].join(' ')
})
</script>
