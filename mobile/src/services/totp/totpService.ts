import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../lib/axios';

interface TotpCodeResponse {
  success: boolean;
  data?: {
    code: string;
    timeRemaining: number;
    period: number;
  };
  message?: string;
}

class TotpService {
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

  async getTotpCode(passwordId: string): Promise<TotpCodeResponse> {
    return this.makeRequest(`/totp/passwords/${passwordId}`);
  }

  async getTotpSecret(passwordId: string): Promise<{ success: boolean; data?: { secret: string }; message?: string }> {
    return this.makeRequest(`/totp/passwords/${passwordId}/secret`);
  }

  async addTotpToPassword(passwordId: string, totpInput: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/totp/passwords/${passwordId}`, {
      method: 'POST',
      data: { totpInput },
    });
  }

  async removeTotpFromPassword(passwordId: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/totp/passwords/${passwordId}`, {
      method: 'DELETE',
    });
  }
}

export const totpService = new TotpService();
