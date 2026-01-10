import { PrismaClient, Contact } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export interface PhoneNumber {
  label: string;
  number: string;
}

export interface Email {
  label: string;
  email: string;
}

export interface Address {
  label: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CreateContactData {
  userId: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
  company?: string;
  jobTitle?: string;
  phoneNumbers?: PhoneNumber[];
  emails?: Email[];
  addresses?: Address[];
  birthday?: Date;
  notes?: string;
  imageUrl?: string;
  isFavorite?: boolean;
}

export interface UpdateContactData {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  company?: string;
  jobTitle?: string;
  phoneNumbers?: PhoneNumber[];
  emails?: Email[];
  addresses?: Address[];
  birthday?: Date;
  notes?: string;
  imageUrl?: string;
  isFavorite?: boolean;
}

export interface SearchFilters {
  userId: string;
  search?: string;
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
}

export interface PaginationResult {
  items: Contact[];
  total: number;
  limit: number;
  offset: number;
}

export class ContactRepository {
  async create(data: CreateContactData): Promise<Contact> {
    return await prisma.contact.create({
      data: {
        ...data,
        phoneNumbers: (data.phoneNumbers || []) as any,
        emails: (data.emails || []) as any,
        addresses: (data.addresses || []) as any,
        isFavorite: data.isFavorite || false,
      },
    });
  }

  async findById(id: string, userId?: string): Promise<Contact | null> {
    return await prisma.contact.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
    });
  }

  async search(filters: SearchFilters): Promise<PaginationResult> {
    const where: any = {
      userId: filters.userId,
    };

    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { nickname: { contains: searchTerm, mode: 'insensitive' } },
        { company: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: [
          { isFavorite: 'desc' },
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async findByUserId(userId: string): Promise<Contact[]> {
    return await prisma.contact.findMany({
      where: { userId },
      orderBy: [
        { isFavorite: 'desc' },
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });
  }

  async update(id: string, data: UpdateContactData): Promise<Contact> {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };
    
    if (data.phoneNumbers) updateData.phoneNumbers = data.phoneNumbers as any;
    if (data.emails) updateData.emails = data.emails as any;
    if (data.addresses) updateData.addresses = data.addresses as any;
    
    return await prisma.contact.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.contact.delete({
      where: { id },
    });
  }
}

