<template>
  <div class="fixed top-4 right-4 z-50 space-y-1">
    <TransitionGroup
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <CustomToast
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :show="true"
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        @close="toastStore.hideToast(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import CustomToast from '@/components/ui/CustomToast.vue'

const toastStore = useToastStore()
</script>
