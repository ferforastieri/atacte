import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import apiClient from '../../lib/axios';

const { ForegroundTracking } = NativeModules;

interface LoginRequest {
  email: string;
  masterPassword: string;
  deviceName?: string;
}

interface RegisterRequest {
  email: string;
  masterPassword: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      phoneNumber?: string;
      profilePicture?: string;
      role?: 'USER' | 'ADMIN';
    };
    requiresTrust?: boolean;
    sessionId?: string;
  };
  message?: string;
  isAuthError?: boolean;
  isNetworkError?: boolean;
}

class AuthService {
  private async makeRequest(
    endpoint: string, 
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      data?: unknown;
      params?: Record<string, string>;
    } = {}
  ): Promise<AuthResponse> {
    try {
      const response = await apiClient({
        url: endpoint,
        ...options,
      });
      return response.data as AuthResponse;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: AuthResponse } };
        if (axiosError.response?.status === 401) {
          return { success: false, message: 'Não autorizado', isAuthError: true };
        }
        return axiosError.response?.data || { success: false, message: 'Erro de conexão', isNetworkError: true };
      }
      return { success: false, message: 'Erro de conexão', isNetworkError: true };
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      data: credentials,
    });

    if (response.success && response.data?.token && response.data?.user) {
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      if (Platform.OS === 'android' && ForegroundTracking) {
        const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
        ForegroundTracking.saveAuthToken(response.data.token, apiUrl, () => {}, (error: Error) => {
          console.error('Erro ao salvar token nativo:', error);
        });
      }
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.makeRequest('/auth/register', {
      method: 'POST',
      data: userData,
    });

    if (response.success && response.data?.token) {
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      if (Platform.OS === 'android' && ForegroundTracking) {
        const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
        ForegroundTracking.saveAuthToken(response.data.token, apiUrl, () => {}, (error: Error) => {
          console.error('Erro ao salvar token nativo:', error);
        });
      }
    }

    return response;
  }

  async getMe(): Promise<AuthResponse> {
    return this.makeRequest('/auth/me');
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    
    if (Platform.OS === 'android' && ForegroundTracking) {
      try {
        await new Promise<void>((resolve, reject) => {
          ForegroundTracking.clearAuthToken(() => {
            resolve();
          }, (error: Error) => {
            reject(error);
          });
        });
      } catch (error) {
      }
    }
  }

  async getStoredUser() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  async getStoredToken() {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token && Platform.OS === 'android' && ForegroundTracking) {
      try {
        await new Promise<void>((resolve, reject) => {
          ForegroundTracking.clearAuthToken(() => {
            resolve();
          }, (error: Error) => {
            reject(error);
          });
        });
      } catch (error) {
      }
    }
    return token;
  }

  async requestPasswordReset(email: string): Promise<AuthResponse> {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      data: { email },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    return this.makeRequest('/auth/reset-password', {
      method: 'POST',
      data: { token, newPassword },
    });
  }

  async trustDevice(sessionId: string): Promise<AuthResponse> {
    return this.makeRequest('/auth/trust-device', {
      method: 'POST',
      data: { sessionId },
    });
  }

  async getSessions(limit = 10, offset = 0): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    return this.makeRequest(`/auth/sessions?${params.toString()}`);
  }

  async revokeSession(sessionId: string): Promise<any> {
    return this.makeRequest(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async untrustDevice(deviceName: string): Promise<any> {
    return this.makeRequest('/auth/untrust-device', {
      method: 'POST',
      data: { deviceName },
    });
  }
}

export const authService = new AuthService();
