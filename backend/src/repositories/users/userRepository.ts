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
    logs: any[];
    total: number;
  }> {
    const where: any = { userId };

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
      const query = filters.query.toLowerCase();
      where.OR = [
        { action: { contains: query } },
        { ipAddress: { contains: query } },
        { userAgent: { contains: query } }
      ];
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

  async exportUserData(userId: string): Promise<any> {
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
