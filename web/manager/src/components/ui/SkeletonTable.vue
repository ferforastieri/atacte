<template>
  <div class="overflow-hidden rounded-xl border border-line" aria-hidden="true">
    <div class="grid gap-4 bg-surface-muted px-4 py-3" :style="gridStyle">
      <div v-for="column in columns" :key="`head-${column}`" class="skeleton h-3 w-3/4"></div>
    </div>
    <div
      v-for="row in rows"
      :key="row"
      class="grid items-center gap-4 border-t border-line bg-surface px-4 py-4"
      :style="gridStyle"
    >
      <div v-for="column in columns" :key="`cell-${row}-${column}`" class="space-y-2">
        <div class="skeleton h-3.5" :style="{ width: `${55 + ((row * 7 + column * 11) % 35)}%` }"></div>
        <div v-if="column === 1" class="skeleton h-3 w-1/2"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  rows?: number
  columns?: number
}>(), {
  rows: 5,
  columns: 5
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`
}))
</script>
