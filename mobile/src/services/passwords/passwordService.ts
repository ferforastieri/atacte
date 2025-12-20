import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../lib/axios';

interface PasswordEntry {
  id: string;
  name: string;
  website?: string;
  username?: string;
  password: string;
  folder?: string;
  notes?: string;
  isFavorite: boolean;
  totpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  customFields?: Array<{
    id: string;
    name: string;
    value: string;
  }>;
}

interface CreatePasswordRequest {
  name: string;
  website?: string;
  username?: string;
  password: string;
  folder?: string;
  notes?: string;
  isFavorite?: boolean;
  totpEnabled?: boolean;
  totpSecret?: string;
  customFields?: Array<{
    name: string;
    value: string;
  }>;
}

interface UpdatePasswordRequest {
  name?: string;
  website?: string;
  username?: string;
  password?: string;
  folder?: string;
  notes?: string;
  isFavorite?: boolean;
  totpEnabled?: boolean;
  totpSecret?: string;
  customFields?: Array<{
    name: string;
    value: string;
  }>;
}

interface PasswordListResponse {
  success: boolean;
  data?: PasswordEntry[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
  message?: string;
}

class PasswordService {
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

  async getPasswords(params?: {
    query?: string;
    folder?: string;
    isFavorite?: boolean;
    totpEnabled?: boolean;
    page?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PasswordListResponse> {
    return this.makeRequest('/passwords', {
      method: 'GET',
      params: params,
    });
  }

  async createPassword(passwordData: CreatePasswordRequest): Promise<{ success: boolean; data?: PasswordEntry; message?: string }> {
    return this.makeRequest('/passwords', {
      method: 'POST',
      data: passwordData,
    });
  }

  async updatePassword(id: string, passwordData: UpdatePasswordRequest): Promise<{ success: boolean; data?: PasswordEntry; message?: string }> {
    return this.makeRequest(`/passwords/${id}`, {
      method: 'PUT',
      data: passwordData,
    });
  }

  async deletePassword(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/passwords/${id}`, {
      method: 'DELETE',
    });
  }

  async getPassword(id: string): Promise<{ success: boolean; data?: PasswordEntry; message?: string }> {
    return this.makeRequest(`/passwords/${id}`);
  }
}

export const passwordService = new PasswordService();
