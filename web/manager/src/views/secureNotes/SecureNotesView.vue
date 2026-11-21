<template>
  <div class="min-h-screen bg-canvas">
    <AppHeader :show-logo="true" :show-navigation="true" />

    <main class="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-10 lg:px-10">
      <section class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-400">Cofre</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Notas Seguras</h1>
          <p class="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">
            Guarde textos privados e encontre tudo por título, conteúdo ou pasta.
          </p>
        </div>

        <BaseButton class="sm:w-auto" @click="showCreateModal = true">
          <PlusIcon class="mr-2 h-4 w-4" />
          Nova Nota
        </BaseButton>
      </section>

      <section class="mb-5 grid grid-cols-2 gap-3 sm:mb-6 lg:grid-cols-4">
        <div class="surface-card p-4">
          <div class="flex items-center gap-3">
            <div class="icon-tile"><DocumentTextIcon class="h-5 w-5" /></div>
            <div class="min-w-0">
              <p class="text-[11px] leading-tight text-ink-muted">Nesta página</p>
              <div v-if="isInitialLoading" class="skeleton mt-1 h-6 w-12"></div>
              <p v-else class="text-xl font-semibold text-ink">{{ notes.length }}</p>
            </div>
          </div>
        </div>

        <div class="surface-card p-4">
          <div class="flex items-center gap-3">
            <div class="icon-tile"><StarIcon class="h-5 w-5" /></div>
            <div class="min-w-0">
              <p class="text-[11px] leading-tight text-ink-muted">Favoritas</p>
              <div v-if="isInitialLoading" class="skeleton mt-1 h-6 w-12"></div>
              <p v-else class="text-xl font-semibold text-ink">{{ favoriteCount }}</p>
            </div>
          </div>
        </div>

        <div class="surface-card p-4">
          <div class="flex items-center gap-3">
            <div class="icon-tile"><FolderIcon class="h-5 w-5" /></div>
            <div class="min-w-0">
              <p class="text-[11px] leading-tight text-ink-muted">Pastas</p>
              <div v-if="isInitialLoading" class="skeleton mt-1 h-6 w-12"></div>
              <p v-else class="text-xl font-semibold text-ink">{{ folders.length }}</p>
            </div>
          </div>
        </div>

        <div class="surface-card p-4">
          <div class="flex items-center gap-3">
            <div class="icon-tile"><ClipboardDocumentListIcon class="h-5 w-5" /></div>
            <div class="min-w-0">
              <p class="text-[11px] leading-tight text-ink-muted">Resultados</p>
              <div v-if="isInitialLoading" class="skeleton mt-1 h-6 w-12"></div>
              <p v-else class="text-xl font-semibold text-ink">{{ secureNotesStore.pagination.total }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="surface-card mb-5 p-4 sm:mb-6">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div class="min-w-0 flex-1">
            <SearchInput
              v-model="searchQuery"
              placeholder="Buscar notas..."
              @search="handleSearch"
            />
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <BaseSelect
              v-model="selectedFolder"
              class="w-full sm:w-48"
              :disabled="isFetching"
              @update:modelValue="handleFolderFilter"
            >
              <option value="">Todas as pastas</option>
              <option v-for="folder in folders" :key="folder" :value="folder">
                {{ folder }}
              </option>
            </BaseSelect>

            <BaseButton
              variant="ghost"
              :disabled="isFetching"
              :class="{ 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300': showOnlyFavorites }"
              @click="toggleFavorites"
            >
              <StarIcon class="mr-1.5 h-4 w-4" :class="{ 'fill-current': showOnlyFavorites }" />
              {{ showOnlyFavorites ? 'Todas' : 'Favoritas' }}
            </BaseButton>
          </div>
        </div>
      </section>

      <div v-if="isInitialLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div v-for="index in 8" :key="index" class="surface-card space-y-3 p-5">
          <div class="flex items-center gap-3">
            <div class="skeleton h-10 w-10 rounded-xl"></div>
            <div class="skeleton h-4 w-2/3"></div>
          </div>
          <div class="skeleton h-3 w-full"></div>
          <div class="skeleton h-3 w-5/6"></div>
          <div class="skeleton h-3 w-2/3"></div>
          <div class="skeleton mt-4 h-6 w-20 rounded-full"></div>
        </div>
      </div>

      <div
        v-else-if="notes.length > 0"
        class="grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        :class="{ 'pointer-events-none opacity-60': isFetching }"
      >
        <BaseCard
          v-for="note in notes"
          :key="note.id"
          hover
          padding="none"
          class="cursor-pointer"
          @click="viewNote(note)"
        >
          <div class="flex h-full min-h-[190px] flex-col p-5">
            <div class="flex items-start gap-3">
              <div class="icon-tile">
                <DocumentTextIcon class="h-5 w-5" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="truncate font-semibold text-ink">{{ note.title }}</h3>
                  <StarIcon
                    v-if="note.isFavorite"
                    class="h-4 w-4 flex-shrink-0 fill-current text-warning-500"
                  />
                </div>
                <p class="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                  {{ note.content }}
                </p>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span v-if="note.folder" class="pill-neutral">
                <FolderIcon class="h-3.5 w-3.5" /> {{ note.folder }}
              </span>
              <span class="pill-neutral">{{ formatDate(note.updatedAt) }}</span>
            </div>

            <div class="mt-auto flex items-center justify-end gap-1.5 border-t border-line pt-3">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-warning-50 hover:text-warning-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-warning-900/20 dark:hover:text-warning-400"
                :class="{ 'text-warning-500': note.isFavorite }"
                :disabled="favoritePendingId === note.id"
                :title="note.isFavorite ? 'Remover das favoritas' : 'Marcar como favorita'"
                :aria-label="note.isFavorite ? 'Remover das favoritas' : 'Marcar como favorita'"
                @click.stop="toggleFavorite(note)"
              >
                <span
                  v-if="favoritePendingId === note.id"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></span>
                <StarIcon v-else class="h-4 w-4" :class="{ 'fill-current': note.isFavorite }" />
              </button>

              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                title="Editar nota"
                aria-label="Editar nota"
                @click.stop="editNote(note)"
              >
                <PencilIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </BaseCard>
      </div>

      <EmptyState
        v-else
        :icon="DocumentTextIcon"
        :title="hasActiveFilters ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'"
        :description="hasActiveFilters ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira nota.'"
      >
        <BaseButton v-if="!hasActiveFilters" @click="showCreateModal = true">
          <PlusIcon class="mr-2 h-4 w-4" />
          Nova Nota
        </BaseButton>
      </EmptyState>

      <Pagination
        v-if="secureNotesStore.pagination.total > secureNotesStore.pagination.limit"
        class="mt-6"
        :current-page="secureNotesStore.pagination.currentPage"
        :total-pages="totalPages"
        :total="secureNotesStore.pagination.total"
        :limit="secureNotesStore.pagination.limit"
        :busy="isFetching"
        @previous="previousPage"
        @next="nextPage"
        @go-to-page="goToPage"
      />
    </main>

    <CreateSecureNoteModal
      :show="showCreateModal"
      :folders="folders"
      @close="showCreateModal = false"
      @created="handleNoteCreated"
    />

    <SecureNoteDetailModal
      :show="showViewModal"
      :note="selectedNote"
      :folders="folders"
      @close="closeViewModal"
      @updated="handleNoteUpdated"
      @deleted="handleNoteDeleted"
    />

    <EditSecureNoteModal
      :show="showEditModal"
      :note="selectedNote"
      :folders="folders"
      @close="closeEditModal"
      @updated="handleNoteUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  FolderIcon,
  PencilIcon,
  PlusIcon,
  StarIcon
} from '@heroicons/vue/24/outline'
import { useSecureNotesStore } from '@/stores/secureNotes'
import type { SecureNote } from '@/api/secureNotes'
import {
  AppHeader,
  BaseButton,
  BaseCard,
  BaseSelect,
  EmptyState,
  Pagination,
  SearchInput
} from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import CreateSecureNoteModal from '@/components/secureNotes/CreateSecureNoteModal.vue'
import EditSecureNoteModal from '@/components/secureNotes/EditSecureNoteModal.vue'
import SecureNoteDetailModal from '@/components/secureNotes/SecureNoteDetailModal.vue'

const secureNotesStore = useSecureNotesStore()
const toast = useToast()

const showCreateModal = ref(false)
const showViewModal = ref(false)
const showEditModal = ref(false)
const selectedNote = ref<SecureNote | null>(null)
const isInitialLoading = ref(true)
const favoritePendingId = ref<string | null>(null)
const searchQuery = ref(secureNotesStore.searchFilters.query || '')
const selectedFolder = ref(secureNotesStore.searchFilters.folder || '')
const showOnlyFavorites = ref(secureNotesStore.searchFilters.isFavorite === true)

const folders = computed(() => secureNotesStore.folders)
const notes = computed(() => secureNotesStore.notes)
const favoriteCount = computed(() => notes.value.filter(n => n.isFavorite).length)
const hasActiveFilters = computed(() => Boolean(searchQuery.value || selectedFolder.value || showOnlyFavorites.value))
const isFetching = computed(() => secureNotesStore.isLoading)
const totalPages = computed(() => Math.max(1, Math.ceil(secureNotesStore.pagination.total / secureNotesStore.pagination.limit)))

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const refreshNotes = async () => {
  try {
    await Promise.all([
      secureNotesStore.fetchNotes(),
      secureNotesStore.fetchFolders()
    ])
  } catch {
    toast.error('Não foi possível atualizar as notas.')
  }
}

const handleSearch = async (query: string) => {
  secureNotesStore.setFilter({ query, offset: 0 })
  try {
    await secureNotesStore.fetchNotes()
  } catch {
    toast.error('Não foi possível buscar as notas.')
  }
}

const handleFolderFilter = async () => {
  secureNotesStore.setFilter({ folder: selectedFolder.value || undefined, offset: 0 })
  try {
    await secureNotesStore.fetchNotes()
  } catch {
    toast.error('Não foi possível filtrar por pasta.')
  }
}

const toggleFavorites = async () => {
  showOnlyFavorites.value = !showOnlyFavorites.value
  secureNotesStore.setFilter({ isFavorite: showOnlyFavorites.value || undefined, offset: 0 })
  try {
    await secureNotesStore.fetchNotes()
  } catch {
    toast.error('Não foi possível filtrar as favoritas.')
  }
}

const handleNoteCreated = async () => {
  showCreateModal.value = false
  await refreshNotes()
}

const viewNote = (note: SecureNote) => {
  selectedNote.value = note
  showViewModal.value = true
}

const closeViewModal = () => {
  showViewModal.value = false
  selectedNote.value = null
}

const editNote = (note: SecureNote) => {
  selectedNote.value = note
  showViewModal.value = false
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedNote.value = null
}

const handleNoteUpdated = async () => {
  closeEditModal()
  closeViewModal()
  await refreshNotes()
}

const handleNoteDeleted = async () => {
  await refreshNotes()
}

const toggleFavorite = async (note: SecureNote) => {
  if (favoritePendingId.value) return

  favoritePendingId.value = note.id
  try {
    await secureNotesStore.toggleFavorite(note.id)
    if (showOnlyFavorites.value) await secureNotesStore.fetchNotes()
  } catch {
    toast.error('Não foi possível atualizar a favorita.')
  } finally {
    favoritePendingId.value = null
  }
}

const goToPage = (page: number) => {
  secureNotesStore.fetchNotes({ offset: (page - 1) * secureNotesStore.pagination.limit })
}

const nextPage = () => {
  if (secureNotesStore.pagination.currentPage < totalPages.value) {
    goToPage(secureNotesStore.pagination.currentPage + 1)
  }
}

const previousPage = () => {
  if (secureNotesStore.pagination.currentPage > 1) {
    goToPage(secureNotesStore.pagination.currentPage - 1)
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      secureNotesStore.fetchNotes(),
      secureNotesStore.fetchFolders()
    ])
  } catch {
    toast.error('Não foi possível carregar as notas.')
  } finally {
    isInitialLoading.value = false
  }
})
</script>
