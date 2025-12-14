import { prisma } from '../../infrastructure/prisma';
import { UserPreferences } from '@prisma/client';

export interface CreateUserPreferencesData {
  userId: string;
  theme?: string;
}

export interface UpdateUserPreferencesData {
  theme?: string;
}

export class PreferencesRepository {
  async create(data: CreateUserPreferencesData): Promise<UserPreferences> {
    return await prisma.userPreferences.create({
      data: data as any,
    });
  }

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const result = await prisma.userPreferences.findUnique({
      where: { userId },
    });
    return result;
  }

  async update(userId: string, data: UpdateUserPreferencesData): Promise<UserPreferences> {
    
    const result = await prisma.userPreferences.update({
      where: { userId },
      data: {
        theme: data.theme,
        updatedAt: new Date(),
      },
    });
    
    return result;
  }

  async delete(userId: string): Promise<void> {
    await prisma.userPreferences.delete({
      where: { userId },
    });
  }

  async upsert(userId: string, data: CreateUserPreferencesData): Promise<UserPreferences> {
    
    const result = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        theme: data.theme,
        updatedAt: new Date(),
      },
      create: {
        userId: data.userId,
        theme: data.theme,
      },
    });
    
    return result;
  }
}
