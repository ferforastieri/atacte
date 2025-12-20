import { PreferencesRepository, CreateUserPreferencesData, UpdateUserPreferencesData } from '../../repositories/preferences/preferencesRepository';

export interface UserPreferencesDto {
  id: string;
  userId: string;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PreferencesService {
  private preferencesRepository: PreferencesRepository;

  constructor() {
    this.preferencesRepository = new PreferencesRepository();
  }

  async getUserPreferences(userId: string): Promise<UserPreferencesDto | null> {
    const preferences = await this.preferencesRepository.findByUserId(userId);
    
    if (!preferences) {
      return null;
    }

    return this.mapToDto(preferences);
  }

  async createUserPreferences(userId: string, data: CreateUserPreferencesData): Promise<UserPreferencesDto> {
    const preferences = await this.preferencesRepository.create({
      userId,
      theme: data.theme || 'light',
    });

    return this.mapToDto(preferences);
  }

  async updateUserPreferences(userId: string, data: UpdateUserPreferencesData): Promise<UserPreferencesDto | null> {
    
    const existingPreferences = await this.preferencesRepository.findByUserId(userId);
    
    if (!existingPreferences) {
      return null;
    }

    const preferences = await this.preferencesRepository.update(userId, data);
    
    return this.mapToDto(preferences);
  }

  async upsertUserPreferences(userId: string, data: CreateUserPreferencesData): Promise<UserPreferencesDto> {
    
    const preferences = await this.preferencesRepository.upsert(userId, {
      userId,
      theme: data.theme || 'light',
    });

    return this.mapToDto(preferences);
  }

  async deleteUserPreferences(userId: string): Promise<boolean> {
    try {
      await this.preferencesRepository.delete(userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapToDto(preferences: { id: string; userId: string; theme: string; createdAt: Date; updatedAt: Date }): UserPreferencesDto {
    return {
      id: preferences.id,
      userId: preferences.userId,
      theme: preferences.theme,
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    };
  }
}
