<template>
  <span class="inline-flex items-center gap-2" :aria-label="showText ? 'Atacte' : undefined">
    <img
      :src="symbolUrl"
      :width="size"
      :height="size"
      :alt="showText ? '' : 'Atacte'"
      :aria-hidden="showText ? 'true' : undefined"
      class="flex-shrink-0 object-contain"
    />
    <span v-if="showText" class="text-xl font-bold">Atacte</span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number; showText?: boolean }>(), {
  size: 32,
  showText: false,
})

const symbolUrl = `${import.meta.env.BASE_URL}atacte-symbol.png`
</script>
