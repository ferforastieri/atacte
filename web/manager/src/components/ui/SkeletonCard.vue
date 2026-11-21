<template>
  <div class="surface-card overflow-hidden" aria-hidden="true">
    <div class="flex flex-col gap-4 p-5 sm:p-6">
      <div class="flex items-start gap-4">
        <div class="skeleton h-11 w-11 flex-shrink-0 rounded-xl"></div>
        <div class="min-w-0 flex-1 space-y-2.5">
          <div class="skeleton h-4 w-3/5"></div>
          <div class="skeleton h-3 w-4/5"></div>
        </div>
        <div class="skeleton h-6 w-14 flex-shrink-0 rounded-full"></div>
      </div>

      <div v-if="showSecret" class="skeleton h-12 w-full rounded-xl"></div>

      <div class="flex items-center gap-2 border-t border-line pt-4">
        <div class="skeleton h-10 w-10 flex-shrink-0 rounded-xl"></div>
        <div class="skeleton h-10 w-24 flex-shrink-0 rounded-xl"></div>
        <div class="skeleton h-10 flex-1 rounded-xl"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  showSecret?: boolean
}>(), {
  showSecret: false
})
</script>
