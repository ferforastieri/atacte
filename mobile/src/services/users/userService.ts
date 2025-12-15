import apiClient from '../../lib/axios';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface UpdateUserProfileData {
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

interface UserProfileResponse {
  success: boolean;
  data?: UserProfile;
  message?: string;
}

class UserService {
  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    try {
      const response = await apiClient({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Erro de conexão' };
    }
  }

  async getUserProfile(): Promise<UserProfileResponse> {
    return this.makeRequest('/users/profile');
  }

  async updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponse> {
    return this.makeRequest('/users/profile', {
      method: 'PATCH',
      data: data,
    });
  }

  async getAuditLogs(filters?: {
    query?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    if (filters?.query) params.append('query', filters.query);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    return this.makeRequest(`/users/audit-logs?${params.toString()}`);
  }

  async getAllUsers(): Promise<any> {
    return this.makeRequest('/users/admin/users');
  }

  async updateUser(userId: string, data: {
    email?: string;
    name?: string;
    phoneNumber?: string;
    isActive?: boolean;
    role?: 'USER' | 'ADMIN';
  }): Promise<any> {
    return this.makeRequest(`/users/admin/users/${userId}`, {
      method: 'PATCH',
      data,
    });
  }

  async changeUserPassword(userId: string, newPassword: string): Promise<any> {
    return this.makeRequest(`/users/admin/users/${userId}/change-password`, {
      method: 'POST',
      data: { newPassword },
    });
  }
}

export const userService = new UserService();
