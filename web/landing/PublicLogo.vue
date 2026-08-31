<template>
  <span class="inline-flex items-center gap-2" :aria-label="showText ? 'Atacte' : undefined">
    <svg :width="size" :height="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#22c55e" stroke="#15803d" stroke-width="2" />
      <path d="M12 14v-2a4 4 0 1 1 8 0v2" stroke="white" stroke-width="2" stroke-linecap="round" />
      <rect x="10" y="14" width="12" height="8" rx="2" fill="white" />
      <text x="16" y="26" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#15803d">A</text>
    </svg>
    <span v-if="showText" class="text-xl font-bold">Atacte</span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number; showText?: boolean }>(), {
  size: 32,
  showText: false,
})
</script>
