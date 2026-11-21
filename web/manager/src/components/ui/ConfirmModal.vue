<template>
  <BaseModal
    :show="show"
    size="sm"
    :closable="!loading"
    :close-on-overlay="!loading"
    :close-on-escape="!loading"
    @close="handleCancel"
  >
    <template #header>
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          :class="variant === 'danger'
            ? 'bg-danger-50 text-danger-600 dark:bg-danger-900/40 dark:text-danger-300'
            : 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'"
        >
          <ExclamationTriangleIcon class="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 class="text-lg font-semibold text-ink">{{ title }}</h3>
      </div>
    </template>

    <p class="text-sm leading-relaxed text-ink-muted">{{ message }}</p>

    <template #footer>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <BaseButton
          variant="ghost"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </BaseButton>
        <BaseButton
          :variant="variant === 'danger' ? 'danger' : 'primary'"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

interface Props {
  show: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  variant?: 'default' | 'danger'
}

withDefaults(defineProps<Props>(), {
  title: 'Confirmar ação',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  loading: false,
  variant: 'default'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>
