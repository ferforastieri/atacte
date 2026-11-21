<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        @click="handleOverlayClick"
      >
        <div
          :class="['flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-pop ring-1 ring-line sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl', sizeClass]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          @click.stop
        >
          <div
            v-if="$slots.header || title"
            class="flex items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-6 sm:py-5"
          >
            <slot name="header">
              <div class="flex min-w-0 items-center gap-3">
                <div v-if="icon" class="icon-tile h-11 w-11">
                  <component :is="icon" class="h-5 w-5" aria-hidden="true" />
                </div>
                <div class="min-w-0">
                  <h3 :id="titleId" class="text-lg font-semibold text-ink">{{ title }}</h3>
                  <p v-if="subtitle" class="mt-0.5 text-xs text-ink-muted">{{ subtitle }}</p>
                </div>
              </div>
            </slot>

            <button
              v-if="closable"
              type="button"
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Fechar"
              @click="$emit('close')"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <div :class="['flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5', bodyClass]">
            <slot />
          </div>

          <div v-if="$slots.footer" class="border-t border-line bg-surface-muted/50 px-4 py-3.5 sm:px-6">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, useId, watch } from 'vue'
import type { Component } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  show: boolean
  title?: string
  subtitle?: string
  icon?: Component
  closable?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  bodyClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  closeOnOverlay: true,
  closeOnEscape: true,
  size: 'md'
})

const emit = defineEmits<{
  close: []
}>()

const uid = useId()
const titleId = `modal-title-${uid}`

const sizeClass = computed(() => {
  const sizes = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-3xl',
    xl: 'sm:max-w-5xl'
  }
  return sizes[props.size]
})

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    emit('close')
  }
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && props.show) {
    emit('close')
  }
}

let previousOverflow = ''

const preventBodyScroll = () => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

const restoreBodyScroll = () => {
  document.body.style.overflow = previousOverflow
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  if (props.show) {
    preventBodyScroll()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  restoreBodyScroll()
})

watch(() => props.show, (show) => {
  if (show) {
    preventBodyScroll()
  } else {
    restoreBodyScroll()
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(14px) scale(0.985);
  opacity: 0;
}
</style>
