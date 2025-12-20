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
  }): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      action: string;
      resourceType?: string;
      resourceId?: string;
      ipAddress?: string;
      userAgent?: string;
      details: Record<string, unknown>;
      createdAt: string;
    }>;
    pagination?: {
      total: number;
      limit: number;
      offset: number;
    };
    message?: string;
  }> {
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

  async getAllUsers(limit = 10, offset = 0): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      email: string;
      name?: string;
      phoneNumber?: string;
      createdAt: string;
      updatedAt: string;
      lastLogin?: string;
      isActive: boolean;
      role: 'USER' | 'ADMIN';
    }>;
    pagination?: {
      total: number;
      limit: number;
      offset: number;
    };
    message?: string;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    return this.makeRequest(`/users/admin/users?${params.toString()}`);
  }

  async updateUser(userId: string, data: {
    email?: string;
    name?: string;
    phoneNumber?: string;
    isActive?: boolean;
    role?: 'USER' | 'ADMIN';
  }): Promise<{
    success: boolean;
    data?: {
      id: string;
      email: string;
      name?: string;
      phoneNumber?: string;
      createdAt: string;
      updatedAt: string;
      lastLogin?: string;
      isActive: boolean;
      role: 'USER' | 'ADMIN';
    };
    message?: string;
  }> {
    return this.makeRequest(`/users/admin/users/${userId}`, {
      method: 'PATCH',
      data,
    });
  }

  async changeUserPassword(userId: string, newPassword: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.makeRequest(`/users/admin/users/${userId}/change-password`, {
      method: 'POST',
      data: { newPassword },
    });
  }

  async deleteUser(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.makeRequest(`/users/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }
}

export const userService = new UserService();
