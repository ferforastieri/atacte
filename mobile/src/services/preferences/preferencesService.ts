import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../lib/axios';

interface UserPreferences {
  id: string;
  userId: string;
  theme: string;
  language: string;
  autoLock: number;
  createdAt: string;
  updatedAt: string;
}

interface UpdatePreferencesRequest {
  theme?: string;
  language?: string;
  autoLock?: number;
}

class PreferencesService {
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

  async getPreferences(): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    return this.makeRequest('/preferences');
  }

  async updatePreferences(data: UpdatePreferencesRequest): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    return this.makeRequest('/preferences', {
      method: 'PUT',
      data: data,
    });
  }

  async upsertPreferences(data: UpdatePreferencesRequest): Promise<{ success: boolean; data?: UserPreferences; message?: string }> {
    return this.makeRequest('/preferences', {
      method: 'PATCH',
      data: data,
    });
  }
}

export const preferencesService = new PreferencesService();
