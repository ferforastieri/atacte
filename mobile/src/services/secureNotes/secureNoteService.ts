import apiClient from '../../lib/axios';

interface SecureNote {
  id: string;
  title: string;
  content: string;
  folder?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateSecureNoteRequest {
  title: string;
  content: string;
  folder?: string;
  isFavorite?: boolean;
}

interface UpdateSecureNoteRequest {
  title?: string;
  content?: string;
  folder?: string;
  isFavorite?: boolean;
}

interface SecureNoteListResponse {
  success: boolean;
  data?: SecureNote[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
  message?: string;
}

class SecureNoteService {
  private async makeRequest<T = { success: boolean; data?: unknown; message?: string }>(
    endpoint: string, 
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      data?: unknown;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> {
    try {
      const response = await apiClient({
        url: endpoint,
        ...options,
      });
      return response.data as T;
    } catch (error: unknown) {
      const errorData = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: T } }).response?.data
        : undefined;
      return (errorData || { success: false, message: 'Erro de conexão' }) as T;
    }
  }

  async getNotes(params?: {
    query?: string;
    folder?: string;
    isFavorite?: boolean;
    page?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<SecureNoteListResponse> {
    return this.makeRequest('/secure-notes', {
      method: 'GET',
      params: params,
    });
  }

  async createNote(noteData: CreateSecureNoteRequest): Promise<{ success: boolean; data?: SecureNote; message?: string }> {
    return this.makeRequest('/secure-notes', {
      method: 'POST',
      data: noteData,
    });
  }

  async updateNote(id: string, noteData: UpdateSecureNoteRequest): Promise<{ success: boolean; data?: SecureNote; message?: string }> {
    return this.makeRequest(`/secure-notes/${id}`, {
      method: 'PUT',
      data: noteData,
    });
  }

  async deleteNote(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/secure-notes/${id}`, {
      method: 'DELETE',
    });
  }

  async getNote(id: string): Promise<{ success: boolean; data?: SecureNote; message?: string }> {
    return this.makeRequest(`/secure-notes/${id}`);
  }

  async getFolders(): Promise<{ success: boolean; data?: string[]; message?: string }> {
    return this.makeRequest('/secure-notes/folders/list', {
      method: 'GET',
    });
  }
}

export const secureNoteService = new SecureNoteService();

