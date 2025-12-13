<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
      <!-- Action Button -->
      <div class="mb-6 flex justify-end">
        <BaseButton
          variant="primary"
          size="sm"
          @click="showCreateModal = true"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Nova Nota
        </BaseButton>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Notes List Container -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Notas</h2>
                
                <!-- Search and Filter -->
                <div class="flex flex-col sm:flex-row gap-3">
                  <div class="flex-1 min-w-0">
                    <SearchInput
                      v-model="searchQuery"
                      placeholder="Buscar notas..."
                      @search="handleSearch"
                    />
                  </div>
                  
                  <select
                    v-model="selectedFolder"
                    @change="handleFolderFilter"
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500 text-sm"
                  >
                    <option value="">Todas as pastas</option>
                    <option v-for="folder in folders" :key="folder" :value="folder">
                      {{ folder }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="p-4">
              <div v-if="filteredNotes.length === 0" class="text-center py-12">
                <DocumentTextIcon class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Nenhuma nota encontrada
                </h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {{ searchQuery || selectedFolder ? 'Tente ajustar os filtros de busca' : 'Crie sua primeira nota segura' }}
                </p>
                <div v-if="!searchQuery && !selectedFolder" class="mt-6">
                  <BaseButton @click="showCreateModal = true" variant="primary">
                    Criar Nota
                  </BaseButton>
                </div>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="note in filteredNotes"
                  :key="note.id"
                  class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  @click="editNote(note)"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {{ note.title }}
                        </h3>
                        <StarIcon
                          v-if="note.isFavorite"
                          class="h-5 w-5 text-yellow-500 flex-shrink-0"
                          fill="currentColor"
                        />
                      </div>
                      <p v-if="note.folder" class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <FolderIcon class="h-3 w-3" />
                        {{ note.folder }}
                      </p>
                    </div>
                    <DocumentTextIcon class="h-5 w-5 text-blue-500 flex-shrink-0" />
                  </div>

                  <!-- Content Preview -->
                  <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {{ note.content }}
                  </p>

                  <!-- Meta and Actions -->
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(note.updatedAt) }}
                    </span>
                    
                    <div class="flex items-center gap-2">
                      <button
                        @click.stop="toggleFavorite(note)"
                        class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        :title="note.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
                      >
                        <StarIcon 
                          :class="note.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'" 
                          class="h-4 w-4" 
                        />
                      </button>
                      
                      <button
                        @click.stop="editNote(note)"
                        class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        title="Editar nota"
                      >
                        <PencilIcon class="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      
                      <button
                        @click.stop="confirmDelete(note)"
                        class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        title="Excluir nota"
                      >
                        <TrashIcon class="h-4 w-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Stats -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Estatísticas</h3>
            </div>
            <div class="p-4 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <DocumentTextIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Total</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Notas</p>
                  </div>
                </div>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ filteredNotes.length }}</p>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <StarIcon class="h-5 w-5 text-yellow-600 dark:text-yellow-400 fill-current" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Favoritas</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Notas</p>
                  </div>
                </div>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ favoriteCount }}</p>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <FolderIcon class="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Pastas</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Organização</p>
                  </div>
                </div>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ folders.length }}</p>
              </div>
            </div>
          </div>

          <!-- Folders -->
          <div v-if="folders.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Pastas</h3>
            </div>
            <div class="p-4">
              <div class="space-y-2">
                <button
                  v-for="folder in folders"
                  :key="folder"
                  @click="selectedFolder = folder; handleFolderFilter()"
                  class="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors"
                  :class="selectedFolder === folder
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <FolderIcon class="h-4 w-4" />
                      <span>{{ folder }}</span>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ notes.filter(n => n.folder === folder).length }}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
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

    <!-- Edit Modal -->
    <EditSecureNoteModal
      :show="showEditModal"
      :note="selectedNote"
      :folders="folders"
      @close="closeEditModal"
      @updated="handleNoteUpdated"
    />

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Confirmar Exclusão"
      message="Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita."
      confirm-text="Excluir"
      cancel-text="Cancelar"
      variant="danger"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSecureNotesStore } from '@/stores/secureNotes'
import { useToast } from 'vue-toastification'
import type { SecureNote } from '@/api/secureNotes'

import { AppHeader, BaseButton, BaseCard, SearchInput, ConfirmModal } from '@/components/ui'
import CreateSecureNoteModal from '@/components/secureNotes/CreateSecureNoteModal.vue'
import EditSecureNoteModal from '@/components/secureNotes/EditSecureNoteModal.vue'

import {
  DocumentTextIcon,
  StarIcon,
  FolderIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const secureNotesStore = useSecureNotesStore()
const toast = useToast()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedNote = ref<SecureNote | null>(null)
const noteToDelete = ref<SecureNote | null>(null)
const isRefreshing = ref(false)
const searchQuery = ref('')
const selectedFolder = ref('')

const folders = computed(() => secureNotesStore.folders)
const notes = computed(() => secureNotesStore.notes)
const favoriteCount = computed(() => notes.value.filter(n => n.isFavorite).length)

const filteredNotes = computed(() => {
  let filtered = [...notes.value]

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

const handleFolderFilter = () => {
  secureNotesStore.setFilter({ folder: selectedFolder.value || undefined })
  secureNotesStore.fetchNotes()
}

const handleNoteCreated = async () => {
  showCreateModal.value = false
  await refreshNotes()
}

const editNote = (note: SecureNote) => {
  selectedNote.value = note
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedNote.value = null
}

const handleNoteUpdated = async () => {
  closeEditModal()
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

const confirmDelete = (note: SecureNote) => {
  noteToDelete.value = note
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!noteToDelete.value) return

  try {
    await secureNotesStore.deleteNote(noteToDelete.value.id)
    toast.success('Nota excluída com sucesso')
    showDeleteModal.value = false
    noteToDelete.value = null
    await refreshNotes()
  } catch (error) {
    toast.error('Erro ao excluir nota')
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
    console.error('Erro ao carregar notas:', error)
    toast.error('Erro ao carregar notas')
  }
})
</script>
