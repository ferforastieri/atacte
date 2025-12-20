import { PrismaClient, User } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export interface UpdateUserData {
  email?: string;
  masterPasswordHash?: string;
  masterPasswordSalt?: string;
  encryptionKeyHash?: string;
  lastLogin?: Date;
  isActive?: boolean;
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  pushToken?: string;
  role?: 'USER' | 'ADMIN';
}

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async findAll(limit?: number, offset?: number): Promise<{ users: User[]; total: number }> {
    const take = limit || undefined;
    const skip = offset || undefined;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.user.count(),
    ]);
    
    return { users, total };
  }

  
  async getUserStats(userId: string): Promise<{
    totalPasswords: number;
    favoritePasswords: number;
    folders: string[];
    weakPasswords: number;
    duplicatedPasswords: number;
    lastActivity?: Date;
    accountAge: number;
    totalLogins: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        passwordEntries: true,
        auditLogs: {
          where: { action: 'LOGIN' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const totalPasswords = user.passwordEntries.length;
    const favoritePasswords = user.passwordEntries.filter(p => p.isFavorite).length;
    
    const folders = [...new Set(
      user.passwordEntries
        .map(p => p.folder)
        .filter(folder => folder)
    )] as string[];

    const weakPasswords = 0; 
    const duplicatedPasswords = 0; 
    
    const lastActivity = user.passwordEntries
      .map(p => p.lastUsed)
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const accountAge = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalLogins = user.auditLogs.length;

    return {
      totalPasswords,
      favoritePasswords,
      folders,
      weakPasswords,
      duplicatedPasswords,
      lastActivity,
      accountAge,
      totalLogins,
    };
  }

  async getUserFolders(userId: string): Promise<string[]> {
    const passwords = await prisma.passwordEntry.findMany({
      where: { userId },
      select: { folder: true },
      distinct: ['folder'],
    });

    return passwords
      .map(p => p.folder)
      .filter(folder => folder) as string[];
  }

  async getUserAuditLogs(
    userId: string, 
    limit: number = 50, 
    offset: number = 0,
    filters?: {
      query?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    logs: Array<{
      id: string;
      userId: string | null;
      action: string;
      resourceType: string | null;
      resourceId: string | null;
      ipAddress: string | null;
      userAgent: string | null;
      details: unknown;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const where: {
      userId: string;
      action?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
      AND?: Array<Record<string, unknown>>;
    } = {
      userId
    };

    const andConditions: Array<Record<string, unknown>> = [];

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters?.query) {
      const query = filters.query;
      const queryOrConditions = [
        { action: { contains: query, mode: 'insensitive' } },
        { ipAddress: { contains: query, mode: 'insensitive' } },
        { userAgent: { contains: query, mode: 'insensitive' } }
      ];
      andConditions.push({ OR: queryOrConditions });
    }

    if (andConditions.length > 0) {
      const baseWhere: {
        userId: string;
        action?: string;
        createdAt?: {
          gte?: Date;
          lte?: Date;
        };
      } = { userId };
      if (filters?.action) {
        baseWhere.action = filters.action;
      }
      if (filters?.startDate || filters?.endDate) {
        baseWhere.createdAt = {};
        if (filters.startDate) {
          baseWhere.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          baseWhere.createdAt.lte = filters.endDate;
        }
      }
      
      where.AND = [
        baseWhere,
        ...andConditions
      ];
      
      delete where.action;
      delete where.createdAt;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({
        where,
      }),
    ]);

    return { logs, total };
  }

  async exportUserData(userId: string): Promise<{
    user: {
      id: string;
      email: string;
      createdAt: Date;
      updatedAt: Date;
      lastLogin: Date | null;
      isActive: boolean;
    };
    passwords: Array<{
      name: string;
      website: string | null;
      username: string | null;
      encryptedPassword: string;
      notes: string | null;
      folder: string | null;
      isFavorite: boolean;
      createdAt: Date;
      updatedAt: Date;
      lastUsed: Date | null;
      totpEnabled: boolean;
      customFields: Array<{
        fieldName: string;
        encryptedValue: string;
        fieldType: string;
      }>;
    }>;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        passwordEntries: {
          include: {
            customFields: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
      },
      passwords: user.passwordEntries.map(password => ({
        name: password.name,
        website: password.website,
        username: password.username,
        encryptedPassword: password.encryptedPassword,
        notes: password.notes,
        folder: password.folder,
        isFavorite: password.isFavorite,
        createdAt: password.createdAt,
        updatedAt: password.updatedAt,
        lastUsed: password.lastUsed,
        totpEnabled: password.totpEnabled,
        customFields: password.customFields.map(field => ({
          fieldName: field.fieldName,
          encryptedValue: field.encryptedValue,
          fieldType: field.fieldType,
        })),
      })),
    };
  }
}
