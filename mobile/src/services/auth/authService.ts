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

    if (response.success && response.data?.token && response.data?.user) {
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

  async getSessions(): Promise<any> {
    return this.makeRequest('/auth/sessions');
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
