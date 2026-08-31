import api from './index'

export interface SecureNote {
  id: string
  title: string
  content: string
  folder?: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSecureNoteRequest {
  title: string
  content: string
  folder?: string
  isFavorite?: boolean
}

export interface UpdateSecureNoteRequest extends Partial<CreateSecureNoteRequest> {
  id?: string
}

export interface SecureNoteSearchFilters {
  query?: string
  folder?: string
  isFavorite?: boolean
  limit?: number
  offset?: number
  sortBy?: 'title' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

const secureNotesApi = {
  async searchNotes(filters: SecureNoteSearchFilters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    
    const response = await api.get(`/secure-notes?${params.toString()}`)
    return response.data
  },

  async getNoteById(id: string) {
    const response = await api.get(`/secure-notes/${id}`)
    return response.data
  },

  async createNote(noteData: CreateSecureNoteRequest) {
    const response = await api.post('/secure-notes', noteData)
    return response.data
  },

  async updateNote(id: string, noteData: UpdateSecureNoteRequest) {
    const response = await api.put(`/secure-notes/${id}`, noteData)
    return response.data
  },

  async deleteNote(id: string) {
    const response = await api.delete(`/secure-notes/${id}`)
    return response.data
  },

  async getFolders() {
    const response = await api.get('/secure-notes/folders/list')
    return response.data
  }
}

export default secureNotesApi

