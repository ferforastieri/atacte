<template>
  <div class="flex flex-col gap-3 border-t border-line px-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-center text-sm text-ink-muted sm:text-left">
      Mostrando
      <span class="font-semibold text-ink">{{ startItem }}</span>
      a
      <span class="font-semibold text-ink">{{ endItem }}</span>
      de
      <span class="font-semibold text-ink">{{ total }}</span>
      resultados
    </p>

    <nav class="flex items-center justify-center gap-1.5" aria-label="Paginação">
      <button
        type="button"
        class="flex h-9 items-center gap-1 rounded-xl border border-line bg-surface px-2.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-40 sm:text-sm"
        :disabled="busy || currentPage <= 1"
        aria-label="Página anterior"
        @click="$emit('previous')"
      >
        <ChevronLeftIcon class="h-4 w-4" />
        <span class="hidden sm:inline">Anterior</span>
      </button>

      <div class="hidden items-center gap-1 sm:flex">
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            type="button"
            :aria-current="page === currentPage ? 'page' : undefined"
            :class="[
              'flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-40',
              page === currentPage
                ? 'bg-primary-700 text-white shadow-sm'
                : 'border border-line bg-surface text-ink-muted hover:bg-surface-muted hover:text-ink'
            ]"
            :disabled="busy"
            @click="$emit('goToPage', Number(page))"
          >
            {{ page }}
          </button>
          <span v-else class="flex h-9 min-w-9 items-center justify-center text-sm text-ink-subtle" aria-hidden="true">
            …
          </span>
        </template>
      </div>

      <span class="px-1 text-sm font-medium text-ink-muted sm:hidden">
        {{ currentPage }} / {{ totalPages }}
      </span>

      <button
        type="button"
        class="flex h-9 items-center gap-1 rounded-xl border border-line bg-surface px-2.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-40 sm:text-sm"
        :disabled="busy || currentPage >= totalPages"
        aria-label="Próxima página"
        @click="$emit('next')"
      >
        <span class="hidden sm:inline">Próxima</span>
        <ChevronRightIcon class="h-4 w-4" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

interface Props {
  currentPage: number
  totalPages: number
  total: number
  limit: number
  busy?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  busy: false
})

defineEmits<{
  previous: []
  next: []
  goToPage: [page: number]
}>()

const startItem = computed(() => {
  if (props.total === 0) return 0
  return (props.currentPage - 1) * props.limit + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.limit, props.total)
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const { currentPage, totalPages } = props

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else if (currentPage <= 4) {
    for (let i = 1; i <= 5; i++) {
      pages.push(i)
    }
    pages.push('...')
    pages.push(totalPages)
  } else if (currentPage >= totalPages - 3) {
    pages.push(1)
    pages.push('...')
    for (let i = totalPages - 4; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    pages.push('...')
    pages.push(currentPage - 1)
    pages.push(currentPage)
    pages.push(currentPage + 1)
    pages.push('...')
    pages.push(totalPages)
  }

  return pages
})
</script>
