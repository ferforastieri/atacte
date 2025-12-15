import { Request } from 'express';
import bcrypt from 'bcryptjs';
import { AuditUtil } from '../../utils/auditUtil';
import { UserRepository } from '../../repositories/users/userRepository';

export interface UserProfileDto {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  role?: 'USER' | 'ADMIN';
}

export interface AdminUserDto {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  role: 'USER' | 'ADMIN';
}

export interface UpdateUserByAdminData {
  email?: string;
  name?: string;
  phoneNumber?: string;
  isActive?: boolean;
  role?: 'USER' | 'ADMIN';
}

export interface UpdateUserProfileData {
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

export interface UserStatsDto {
  totalPasswords: number;
  favoritePasswords: number;
  folders: string[];
  weakPasswords: number;
  duplicatedPasswords: number;
  lastActivity?: Date;
  accountAge: number; 
  totalLogins: number;
}

export interface AuditLogDto {
  id: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  createdAt: Date;
}

export interface ExportDataDto {
  user: UserProfileDto;
  passwords: Array<{
    name: string;
    website?: string;
    username?: string;
    password: string;
    notes?: string;
    folder?: string;
    isFavorite: boolean;
    customFields?: Array<{
      fieldName: string;
      value: string;
      fieldType: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
    lastUsed?: Date;
    totpEnabled: boolean;
  }>;
  exportedAt: Date;
}

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phoneNumber: user.phoneNumber || undefined,
      profilePicture: user.profilePicture || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin || undefined,
      isActive: user.isActive
    };
  }

  async updateUserProfile(
    userId: string,
    data: UpdateUserProfileData,
    req?: Request
  ): Promise<UserProfileDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    await this.userRepository.update(userId, data);

    await AuditUtil.log(
      userId,
      'PROFILE_UPDATED',
      'USER',
      userId,
      data,
      req
    );

    return this.getUserProfile(userId);
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await this.userRepository.update(userId, { pushToken });
  }

  
  async getUserStats(userId: string): Promise<UserStatsDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    
    const stats = await this.userRepository.getUserStats(userId);

    return {
      totalPasswords: stats.totalPasswords,
      favoritePasswords: stats.favoritePasswords,
      folders: stats.folders,
      weakPasswords: stats.weakPasswords,
      duplicatedPasswords: stats.duplicatedPasswords,
      lastActivity: stats.lastActivity,
      accountAge: stats.accountAge,
      totalLogins: stats.totalLogins
    };
  }

  
  async getUserFolders(userId: string): Promise<string[]> {
    return await this.userRepository.getUserFolders(userId);
  }

  
  async getUserAuditLogs(
    userId: string, 
    options: { 
      limit: number; 
      offset: number;
      query?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ logs: AuditLogDto[]; total: number }> {
    const { limit, offset, query, action, startDate, endDate } = options;

    const filters = {
      query,
      action,
      startDate,
      endDate
    };

    const result = await this.userRepository.getUserAuditLogs(userId, limit, offset, filters);

    const auditLogs: AuditLogDto[] = result.logs.map(log => ({
      id: log.id,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      details: log.details,
      createdAt: log.createdAt
    }));

    return { logs: auditLogs, total: result.total };
  }

  
  async exportUserData(userId: string, req?: Request): Promise<ExportDataDto> {
    
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    
    const exportData = await this.userRepository.exportUserData(userId);

    
    await AuditUtil.log(
      userId, 
      'EXPORT_DATA', 
      'USER', 
      userId, 
      { passwordCount: exportData.passwords.length }, 
      req
    );

    return {
      user: exportData.user,
      passwords: exportData.passwords,
      exportedAt: new Date()
    };
  }

  
  async deleteUserAccount(userId: string, password: string, req?: Request): Promise<void> {
    
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isValidPassword = await bcrypt.compare(password, user.masterPasswordHash);
    if (!isValidPassword) {
      throw new Error('Senha incorreta');
    }

    
    await this.userRepository.delete(userId);

    
    await AuditUtil.log(
      userId, 
      'ACCOUNT_DELETED', 
      'USER', 
      userId, 
      { email: user.email }, 
      req
    );
  }

  
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.updateLastLogin(userId);
  }

  
  async deactivateAccount(userId: string, req?: Request): Promise<void> {
    await this.userRepository.update(userId, { isActive: false });

    await AuditUtil.log(
      userId, 
      'ACCOUNT_DELETED', 
      'USER', 
      userId, 
      { action: 'deactivated' }, 
      req
    );
  }

  
  async reactivateAccount(userId: string, req?: Request): Promise<void> {
    await this.userRepository.update(userId, { isActive: true });

    await AuditUtil.log(
      userId, 
      'USER_REGISTERED', 
      'USER', 
      userId, 
      { action: 'reactivated' }, 
      req
    );
  }

  async getAllUsers(limit?: number, offset?: number): Promise<{ users: AdminUserDto[]; total: number }> {
    const result = await this.userRepository.findAll(limit, offset);
    return {
      users: result.users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        phoneNumber: user.phoneNumber || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin || undefined,
        isActive: user.isActive,
        role: (user as any).role || 'USER'
      })),
      total: result.total
    };
  }

  async updateUserByAdmin(
    adminUserId: string,
    userId: string,
    data: UpdateUserByAdminData,
    req?: Request
  ): Promise<AdminUserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.role !== undefined) updateData.role = data.role;

    const updatedUser = await this.userRepository.update(userId, updateData);

    await AuditUtil.log(
      adminUserId,
      'PROFILE_UPDATED',
      'USER',
      userId,
      { changes: data },
      req
    );

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || undefined,
      phoneNumber: updatedUser.phoneNumber || undefined,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      lastLogin: updatedUser.lastLogin || undefined,
      isActive: updatedUser.isActive,
      role: (updatedUser as any).role || 'USER'
    };
  }

  async changeUserPasswordByAdmin(
    adminUserId: string,
    userId: string,
    newPassword: string,
    req?: Request
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const salt = await bcrypt.genSalt(12);
    const masterPasswordHash = await bcrypt.hash(newPassword, salt);

    await this.userRepository.update(userId, {
      masterPasswordHash,
      masterPasswordSalt: salt
    });

    await AuditUtil.log(
      adminUserId,
      'PROFILE_UPDATED',
      'USER',
      userId,
      { changedBy: adminUserId, action: 'password_changed' },
      req
    );
  }

  async deleteUserByAdmin(
    adminUserId: string,
    userId: string,
    req?: Request
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    await this.userRepository.delete(userId);

    await AuditUtil.log(
      adminUserId,
      'ACCOUNT_DELETED',
      'USER',
      userId,
      { deletedBy: adminUserId, email: user.email },
      req
    );
  }
}
