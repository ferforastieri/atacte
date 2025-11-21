import { PrismaClient, SecureNote } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export interface CreateSecureNoteData {
  userId: string;
  title: string;
  encryptedContent: string;
  folder?: string;
  isFavorite?: boolean;
}

export interface UpdateSecureNoteData {
  title?: string;
  encryptedContent?: string;
  folder?: string;
  isFavorite?: boolean;
}

export interface SearchFilters {
  userId: string;
  search?: string;
  folder?: string;
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  items: SecureNote[];
  total: number;
  limit: number;
  offset: number;
}

export class SecureNoteRepository {
  async create(data: CreateSecureNoteData): Promise<SecureNote> {
    return await prisma.secureNote.create({
      data,
    });
  }

  async findById(id: string, userId?: string): Promise<SecureNote | null> {
    return await prisma.secureNote.findFirst({
      where: { 
        id,
        ...(userId && { userId })
      },
    });
  }

  async findByUserId(userId: string): Promise<SecureNote[]> {
    return await prisma.secureNote.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async search(filters: SearchFilters): Promise<PaginationResult> {
    const where: any = {
      userId: filters.userId,
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.folder) {
      where.folder = filters.folder;
    }

    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const sortBy = filters.sortBy || 'title';
    const sortOrder = filters.sortOrder || 'asc';
    
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [items, total] = await Promise.all([
      prisma.secureNote.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.secureNote.count({ where }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async update(id: string, data: UpdateSecureNoteData): Promise<SecureNote> {
    return await prisma.secureNote.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.secureNote.delete({
      where: { id },
    });
  }

  async getUserEncryptionKey(userId: string): Promise<{ encryptionKeyHash: string } | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true },
    });
  }
}

