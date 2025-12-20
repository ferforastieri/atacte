import { PrismaClient, PasswordEntry, CustomField } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export interface CreatePasswordEntryData {
  userId: string;
  name: string;
  website?: string;
  username?: string;
  encryptedPassword: string;
  notes?: string;
  folder?: string;
  isFavorite?: boolean;
  totpSecret?: string;
  totpEnabled?: boolean;
  customFields?: Array<{
    fieldName: string;
    encryptedValue: string;
    fieldType: string;
  }>;
}

export interface UpdatePasswordEntryData {
  name?: string;
  website?: string;
  username?: string;
  encryptedPassword?: string;
  notes?: string;
  folder?: string;
  isFavorite?: boolean;
  lastUsed?: Date;
  totpSecret?: string;
  totpEnabled?: boolean;
}

export interface CreateCustomFieldData {
  passwordEntryId: string;
  fieldName: string;
  encryptedValue: string;
  fieldType?: string;
}

export interface SearchFilters {
  userId: string;
  search?: string;
  folder?: string;
  isFavorite?: boolean;
  totpEnabled?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastUsed';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  items: PasswordEntry[];
  total: number;
  limit: number;
  offset: number;
}

export class PasswordRepository {
  async create(data: CreatePasswordEntryData): Promise<PasswordEntry> {
    const { customFields, ...passwordData } = data;
    
    return await prisma.passwordEntry.create({
      data: {
        ...passwordData,
        customFields: customFields
          ? {
              create: customFields,
            }
          : undefined,
      },
      include: {
        customFields: true,
      },
    });
  }

  async findById(id: string, userId?: string): Promise<PasswordEntry | null> {
    return await prisma.passwordEntry.findFirst({
      where: { 
        id,
        ...(userId && { userId })
      },
      include: {
        customFields: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<PasswordEntry[]> {
    return await prisma.passwordEntry.findMany({
      where: { userId },
      include: {
        customFields: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async search(filters: SearchFilters): Promise<PaginationResult> {
    const where: {
      userId: string;
      OR?: Array<Record<string, unknown>>;
      folder?: string;
      isFavorite?: boolean;
      totpEnabled?: boolean;
    } = {
      userId: filters.userId,
    };

    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { website: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.folder) {
      where.folder = filters.folder;
    }

    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    if (filters.totpEnabled !== undefined) {
      where.totpEnabled = filters.totpEnabled;
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[sortBy] = sortOrder;

    const [items, total] = await Promise.all([
      prisma.passwordEntry.findMany({
        where,
        include: {
          customFields: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.passwordEntry.count({ where }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async update(id: string, data: UpdatePasswordEntryData): Promise<PasswordEntry> {
    return await prisma.passwordEntry.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        customFields: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.passwordEntry.delete({
      where: { id },
    });
  }

  async updateLastUsed(id: string): Promise<void> {
    await prisma.passwordEntry.update({
      where: { id },
      data: {
        lastUsed: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  
  async createCustomField(data: CreateCustomFieldData): Promise<CustomField> {
    return await prisma.customField.create({
      data,
    });
  }

  async findCustomFieldsByPasswordEntryId(passwordEntryId: string): Promise<CustomField[]> {
    return await prisma.customField.findMany({
      where: { passwordEntryId },
    });
  }

  async deleteCustomField(id: string): Promise<void> {
    await prisma.customField.delete({
      where: { id },
    });
  }

  async deleteCustomFieldsByPasswordEntryId(passwordEntryId: string): Promise<void> {
    await prisma.customField.deleteMany({
      where: { passwordEntryId },
    });
  }

  async getUserEncryptionKey(userId: string): Promise<{ encryptionKeyHash: string } | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true },
    });
  }
}
