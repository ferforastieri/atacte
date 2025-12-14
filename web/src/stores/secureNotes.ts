import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import secureNotesApi, { type SecureNote, type CreateSecureNoteRequest, type UpdateSecureNoteRequest, type SecureNoteSearchFilters } from '@/api/secureNotes'

export const useSecureNotesStore = defineStore('secureNotes', () => {
  const notes = ref<SecureNote[]>([])
  const currentNote = ref<SecureNote | null>(null)
  const folders = ref<string[]>([])
  const isLoading = ref(false)
  const pagination = ref({
    total: 0,
    limit: 50,
    offset: 0,
    currentPage: 1
  })
  const searchFilters = ref<SecureNoteSearchFilters>({
    query: '',
    folder: '',
    limit: 50,
    offset: 0,
    sortBy: 'title',
    sortOrder: 'asc'
  })

  const favoriteNotes = computed(() => 
    notes.value.filter(n => n.isFavorite)
  )

  const notesByFolder = computed(() => {
    const grouped = notes.value.reduce((acc, note) => {
      const folder = note.folder || 'Sem pasta'
      if (!acc[folder]) {
        acc[folder] = []
      }
      acc[folder].push(note)
      return acc
    }, {} as Record<string, SecureNote[]>)
    
    return Object.entries(grouped).map(([folder, notes]) => ({
      folder,
      notes,
      count: notes.length
    }))
  })

  const totalCount = computed(() => pagination.value.total)

  const searchResults = computed(() => notes.value)

  const fetchNotes = async (filters?: Partial<SecureNoteSearchFilters>) => {
    isLoading.value = true
    try {
      const currentFilters = { ...searchFilters.value, ...filters }
      const response = await secureNotesApi.searchNotes(currentFilters)
      
      if (response.success) {
        notes.value = response.data
        
        if (response.pagination) {
          pagination.value = {
            total: response.pagination.total,
            limit: response.pagination.limit,
            offset: response.pagination.offset,
            currentPage: Math.floor(response.pagination.offset / response.pagination.limit) + 1
          }
        }
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar notas')
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchNoteById = async (id: string) => {
    isLoading.value = true
    try {
      const response = await secureNotesApi.getNoteById(id)
      if (response.success) {
        currentNote.value = response.data
        return response.data
      }
      throw new Error(response.message || 'Erro ao buscar nota')
    } finally {
      isLoading.value = false
    }
  }

  const createNote = async (noteData: CreateSecureNoteRequest) => {
    isLoading.value = true
    try {
      const response = await secureNotesApi.createNote(noteData)
      if (response.success) {
        notes.value.push(response.data)
        await fetchFolders()
        return response.data
      }
      throw new Error(response.message || 'Erro ao criar nota')
    } finally {
      isLoading.value = false
    }
  }

  const updateNote = async (id: string, noteData: UpdateSecureNoteRequest) => {
    isLoading.value = true
    try {
      const response = await secureNotesApi.updateNote(id, noteData)
      
      if (response.success) {
        const index = notes.value.findIndex(n => n.id === id)
        if (index !== -1) {
          notes.value[index] = response.data
        }
        if (currentNote.value?.id === id) {
          currentNote.value = response.data
        }
        await fetchFolders()
        return response.data
      }
      throw new Error(response.message || 'Erro ao atualizar nota')
    } finally {
      isLoading.value = false
    }
  }

  const deleteNote = async (id: string) => {
    isLoading.value = true
    try {
      const response = await secureNotesApi.deleteNote(id)
      if (response.success) {
        notes.value = notes.value.filter(n => n.id !== id)
        if (currentNote.value?.id === id) {
          currentNote.value = null
        }
        await fetchFolders()
        return true
      }
      throw new Error(response.message || 'Erro ao deletar nota')
    } finally {
      isLoading.value = false
    }
  }

  const fetchFolders = async () => {
    try {
      const response = await secureNotesApi.getFolders()
      if (response.success) {
        folders.value = response.data.sort()
        return response.data
      }
      return []
    } catch (error) {
      return []
    }
  }

  const toggleFavorite = async (id: string) => {
    const note = notes.value.find(n => n.id === id)
    if (!note) return

    try {
      await updateNote(id, { isFavorite: !note.isFavorite })
    } catch (error) {
      throw error
    }
  }

  const resetFilters = () => {
    searchFilters.value = {
      query: '',
      folder: '',
      limit: 50,
      offset: 0,
      sortBy: 'title',
      sortOrder: 'asc'
    }
  }

  const setFilter = (filter: Partial<SecureNoteSearchFilters>) => {
    searchFilters.value = { ...searchFilters.value, ...filter }
  }

  return {
    notes,
    currentNote,
    folders,
    isLoading,
    pagination,
    searchFilters,
    favoriteNotes,
    notesByFolder,
    totalCount,
    searchResults,
    fetchNotes,
    fetchNoteById,
    createNote,
    updateNote,
    deleteNote,
    fetchFolders,
    toggleFavorite,
    resetFilters,
    setFilter
  }
})

