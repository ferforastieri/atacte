import { PrismaClient, PasswordEntry, CustomField, Prisma } from '../../../node_modules/.prisma/client';

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

export class ImportExportRepository {
  async findUserPasswords(userId: string): Promise<PasswordEntry[]> {
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

  async findPasswordByWebsiteAndUsername(userId: string, website?: string, username?: string): Promise<PasswordEntry | null> {
    if (!website && !username) {
      return null;
    }

    const where: {
      userId: string;
      AND?: Array<Record<string, unknown>>;
      website?: string;
      username?: string;
    } = { userId };

    if (website && username) {
      where.AND = [
        { website },
        { username },
      ];
    } else if (website) {
      where.website = website;
    } else if (username) {
      where.username = username;
    }

    return await prisma.passwordEntry.findFirst({
      where,
    });
  }

  async createPasswordEntry(data: CreatePasswordEntryData): Promise<PasswordEntry> {
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

  async createCustomField(data: {
    passwordEntryId: string;
    fieldName: string;
    encryptedValue: string;
    fieldType: string;
  }): Promise<CustomField> {
    return await prisma.customField.create({
      data,
    });
  }

  async getUserEncryptionKey(userId: string): Promise<{ encryptionKeyHash: string } | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true },
    });
  }

  async createAuditLog(data: {
    userId: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        ...data,
        details: data.details ? (data.details as Prisma.InputJsonValue) : Prisma.JsonNull
      },
    });
  }
}
