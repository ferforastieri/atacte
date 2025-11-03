import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../lib/axios';

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
    };
  };
  message?: string;
  isAuthError?: boolean;
  isNetworkError?: boolean;
}

class AuthService {
  private async makeRequest(endpoint: string, options: any = {}): Promise<AuthResponse> {
    try {
      const response = await apiClient({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { success: false, message: 'Não autorizado', isAuthError: true };
      }
      return error.response?.data || { success: false, message: 'Erro de conexão', isNetworkError: true };
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      data: credentials,
    });

    if (response.success && response.data?.token) {
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
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
    }

    return response;
  }

  async getMe(): Promise<AuthResponse> {
    return this.makeRequest('/auth/me');
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
  }

  async getStoredUser() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  async getStoredToken() {
    return AsyncStorage.getItem('auth_token');
  }
}

export const authService = new AuthService();
