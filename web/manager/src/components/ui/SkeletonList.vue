<template>
  <div class="space-y-3" aria-hidden="true">
    <div
      v-for="row in rows"
      :key="row"
      class="flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5"
    >
      <div v-if="avatar" class="skeleton h-10 w-10 flex-shrink-0 rounded-xl"></div>
      <div class="min-w-0 flex-1 space-y-2">
        <div class="skeleton h-3.5" :style="{ width: `${titleWidth(row)}%` }"></div>
        <div class="skeleton h-3" :style="{ width: `${lineWidth(row)}%` }"></div>
      </div>
      <div v-if="action" class="skeleton h-8 w-20 flex-shrink-0 rounded-xl"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
  avatar?: boolean
  action?: boolean
}>(), {
  rows: 5,
  avatar: true,
  action: false
})

const titleWidth = (row: number) => 42 + ((row * 13) % 34)
const lineWidth = (row: number) => 55 + ((row * 17) % 30)
</script>
