<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <BaseCard class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <DocumentTextIcon class="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-blue-100 text-xs sm:text-sm">Total de Notas</p>
              <p class="text-lg sm:text-2xl font-bold">{{ notes.length }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <StarIcon class="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-yellow-100 text-xs sm:text-sm">Favoritas</p>
              <p class="text-lg sm:text-2xl font-bold">{{ favoriteCount }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <FolderIcon class="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-purple-100 text-xs sm:text-sm">Pastas</p>
              <p class="text-lg sm:text-2xl font-bold">{{ folders.length }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <DocumentTextIcon class="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-green-100 text-xs sm:text-sm">Filtradas</p>
              <p class="text-lg sm:text-2xl font-bold">{{ filteredNotes.length }}</p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
        <BaseButton
          variant="primary"
          @click="showCreateModal = true"
          class="w-full sm:w-auto"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Nova Nota
        </BaseButton>
      </div>

      <!-- Search and Filters -->
      <BaseCard class="mb-6 dark:bg-gray-800 dark:border-gray-700" overflow-visible>
        <div class="flex flex-col gap-4" style="position: relative; overflow: visible;">
          <div class="flex-1">
            <SearchInput
              v-model="searchQuery"
              placeholder="Buscar notas..."
              :debounce-ms="300"
              :min-length="2"
              @search="handleSearch"
              @clear="handleSearchClear"
            />
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <BaseSelect
              v-model="selectedFolder"
              @update:modelValue="handleFolderFilter"
              class="w-full sm:w-48"
            >
              <option value="">Todas as pastas</option>
              <option v-for="folder in folders" :key="folder" :value="folder">
                {{ folder }}
              </option>
            </BaseSelect>

            <BaseButton
              variant="ghost"
              @click="toggleFavorites"
              :class="{ 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300': showOnlyFavorites }"
              class="w-full sm:w-auto"
            >
              <StarIcon class="w-4 h-4 mr-1" :class="{ 'fill-current': showOnlyFavorites }" />
              {{ showOnlyFavorites ? 'Todas' : 'Favoritas' }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Notes List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <BaseCard
          v-for="note in filteredNotes"
          :key="note.id"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="viewNote(note)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ note.title }}</h3>
                <div class="flex space-x-1">
                  <StarIcon
                    v-if="note.isFavorite"
                    class="h-4 w-4 text-yellow-500 flex-shrink-0"
                    fill="currentColor"
                  />
                </div>
              </div>
              
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {{ note.content }}
              </p>
              
              <p v-if="note.folder" class="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
                📁 {{ note.folder }}
              </p>
            </div>
            
            <div class="flex flex-col space-y-1 ml-2">
              <button
                @click.stop="toggleFavorite(note)"
                class="text-gray-400 dark:text-gray-500 hover:text-yellow-500 p-1"
                :class="{ 'text-yellow-500': note.isFavorite }"
                title="Marcar como favorita"
              >
                <StarIcon class="h-4 w-4" :class="{ 'fill-current': note.isFavorite }" />
              </button>
              
              <button
                @click.stop="editNote(note)"
                class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                title="Editar nota"
              >
                <PencilIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Empty State -->
      <div v-if="filteredNotes.length === 0" class="text-center py-12">
        <DocumentTextIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhuma nota encontrada</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ notes.length === 0 ? 'Comece criando sua primeira nota.' : 'Tente ajustar os filtros de busca.' }}
        </p>
        <div v-if="notes.length === 0" class="mt-6">
          <BaseButton
            variant="primary"
            @click="showCreateModal = true"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Nova Nota
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <CreateSecureNoteModal
      :show="showCreateModal"
      :folders="folders"
      @close="showCreateModal = false"
      @created="handleNoteCreated"
    />

    <!-- View Note Modal -->
    <SecureNoteDetailModal
      :show="showViewModal"
      :note="selectedNote"
      :folders="folders"
      @close="closeViewModal"
      @updated="handleNoteUpdated"
      @deleted="handleNoteDeleted"
    />

    <!-- Edit Modal -->
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSecureNotesStore } from '@/stores/secureNotes'
import { useToast } from 'vue-toastification'
import type { SecureNote } from '@/api/secureNotes'

import { AppHeader, BaseButton, BaseCard, SearchInput, BaseSelect } from '@/components/ui'
import CreateSecureNoteModal from '@/components/secureNotes/CreateSecureNoteModal.vue'
import EditSecureNoteModal from '@/components/secureNotes/EditSecureNoteModal.vue'
import SecureNoteDetailModal from '@/components/secureNotes/SecureNoteDetailModal.vue'

import {
  DocumentTextIcon,
  StarIcon,
  FolderIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const secureNotesStore = useSecureNotesStore()
const toast = useToast()

const showCreateModal = ref(false)
const showViewModal = ref(false)
const showEditModal = ref(false)
const selectedNote = ref<SecureNote | null>(null)
const isRefreshing = ref(false)
const searchQuery = ref('')
const selectedFolder = ref('')
const showOnlyFavorites = ref(false)

const folders = computed(() => secureNotesStore.folders)
const notes = computed(() => secureNotesStore.notes)
const favoriteCount = computed(() => notes.value.filter(n => n.isFavorite).length)

const filteredNotes = computed(() => {
  let filtered = [...notes.value]

  if (showOnlyFavorites.value) {
    filtered = filtered.filter(note => note.isFavorite)
  }

  if (selectedFolder.value) {
    filtered = filtered.filter(note => note.folder === selectedFolder.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    )
  }

  return filtered
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const refreshNotes = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([
      secureNotesStore.fetchNotes(),
      secureNotesStore.fetchFolders()
    ])
    toast.success('Notas atualizadas')
  } catch (error) {
    toast.error('Erro ao atualizar notas')
  } finally {
    isRefreshing.value = false
  }
}

const handleSearch = () => {
  secureNotesStore.setFilter({ query: searchQuery.value })
  secureNotesStore.fetchNotes()
}

const handleSearchClear = async () => {
  searchQuery.value = ''
  await secureNotesStore.fetchNotes()
}

const handleFolderFilter = () => {
  secureNotesStore.setFilter({ folder: selectedFolder.value || undefined })
  secureNotesStore.fetchNotes()
}

const toggleFavorites = () => {
  showOnlyFavorites.value = !showOnlyFavorites.value
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
  try {
    await secureNotesStore.toggleFavorite(note.id)
    toast.success(note.isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos')
  } catch (error) {
    toast.error('Erro ao atualizar favorito')
  }
}

watch(searchQuery, () => {
  handleSearch()
})

onMounted(async () => {
  try {
    await Promise.all([
      secureNotesStore.fetchNotes(),
      secureNotesStore.fetchFolders()
    ])
  } catch (error) {
    toast.error('Erro ao carregar notas')
  }
})
</script>
