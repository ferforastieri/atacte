<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="border-b border-line px-4 py-4 sm:px-6">
      <slot name="header" />
    </div>

    <div :class="bodyClasses">
      <slot />
    </div>

    <div v-if="$slots.footer" class="rounded-b-2xl border-t border-line bg-surface-muted/50 px-4 py-4 sm:px-6">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'elevated' | 'outlined' | 'muted' | 'hero'
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
  const baseClasses = `rounded-2xl transition-all duration-200 ${overflowClass}`

  const variantClasses = {
    default: 'border border-line bg-surface shadow-card',
    elevated: 'border border-line bg-surface shadow-pop',
    outlined: 'border border-line bg-surface',
    muted: 'border border-line bg-surface-muted',
    hero: 'hero-card text-white'
  }

  const hoverClasses = props.hover
    ? 'hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop'
    : ''

  return [baseClasses, variantClasses[props.variant], hoverClasses].join(' ')
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
