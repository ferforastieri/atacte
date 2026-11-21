<template>
  <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-muted/40 px-6 py-12 text-center">
    <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-ink-subtle shadow-sm ring-1 ring-line">
      <component :is="icon" class="h-6 w-6" aria-hidden="true" />
    </div>
    <h3 class="mt-4 text-sm font-semibold text-ink">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-ink-muted">{{ description }}</p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(defineProps<{
  icon: Component
  title: string
  description?: string
}>(), {
  description: ''
})
</script>
