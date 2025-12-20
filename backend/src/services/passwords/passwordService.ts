import { Request } from 'express';
import { PasswordEntry, CustomField } from '../../infrastructure/prisma';
import { CryptoUtil } from '../../utils/cryptoUtil';
import { AuditUtil } from '../../utils/auditUtil';
import { PasswordUtil, PasswordGeneratorOptions } from '../../utils/passwordUtil';
import { TOTPService, TOTPCode } from '../totp/totpService';
import { PasswordRepository, SearchFilters as RepositorySearchFilters, UpdatePasswordEntryData as RepositoryUpdatePasswordEntryData } from '../../repositories/passwords/passwordRepository';

export interface PasswordEntryDto {
  id: string;
  name: string;
  website?: string;
  username?: string;
  password: string; 
  notes?: string;
  folder?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  customFields?: CustomFieldDto[];
  
  totpEnabled: boolean;
  totpCode?: TOTPCode; 
}

export interface CustomFieldDto {
  id: string;
  fieldName: string;
  value: string; 
  fieldType: string;
}

export interface CreatePasswordEntryData {
  name: string;
  website?: string;
  username?: string;
  password: string;
  notes?: string;
  folder?: string;
  isFavorite?: boolean;
  customFields?: Array<{
    fieldName: string;
    value: string;
    fieldType: 'text' | 'password' | 'email' | 'url' | 'number';
  }>;
  
  totpSecret?: string; 
  totpEnabled?: boolean;
}

export interface UpdatePasswordEntryData extends Partial<CreatePasswordEntryData> {}

export interface SearchFilters {
  query?: string;
  folder?: string;
  isFavorite?: boolean;
  totpEnabled?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastUsed';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  passwords: PasswordEntryDto[];
  total: number;
}

export class PasswordService {
  private passwordRepository: PasswordRepository;

  constructor() {
    this.passwordRepository = new PasswordRepository();
  }

  
  async searchPasswords(userId: string, filters: SearchFilters, _req?: Request): Promise<SearchResult> {
    const {
      query,
      folder,
      isFavorite,
      totpEnabled,
      limit,
      offset,
      sortBy,
      sortOrder
    } = filters;

    
    const searchFilters: RepositorySearchFilters = {
      userId
    };
    
    if (query) searchFilters.search = query;
    if (folder) searchFilters.folder = folder;
    if (isFavorite !== undefined) searchFilters.isFavorite = isFavorite;
    if (totpEnabled !== undefined) searchFilters.totpEnabled = totpEnabled;
    if (limit) searchFilters.limit = limit;
    if (offset) searchFilters.offset = offset;
    
    
    searchFilters.sortBy = sortBy || 'name';
    searchFilters.sortOrder = sortOrder || 'asc';

    const result = await this.passwordRepository.search(searchFilters);
    const passwords = result.items;
    const total = result.total;

    
    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    
    const decryptedPasswords = [];
    for (const password of passwords) {
      try {
        const decryptedPassword = await this.decryptPasswordEntry(password, user.encryptionKeyHash);
        decryptedPasswords.push(decryptedPassword);
      } catch (error) {
        continue;
      }
    }

    return {
      passwords: decryptedPasswords,
      total
    };
  }

  
  async getPasswordById(userId: string, passwordId: string): Promise<PasswordEntryDto | null> {
    const password = await this.passwordRepository.findById(passwordId, userId);

    if (!password) {
      return null;
    }

    
    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    
    await this.passwordRepository.updateLastUsed(passwordId);

    return this.decryptPasswordEntry(password, user.encryptionKeyHash);
  }

  
  async createPassword(userId: string, data: CreatePasswordEntryData, req?: Request): Promise<PasswordEntryDto> {
    
    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    
    const encryptedPassword = CryptoUtil.encrypt(data.password, user.encryptionKeyHash);

    
    let encryptedTotpSecret: string | undefined;
    if (data.totpSecret) {
      if (!TOTPService.isValidSecret(data.totpSecret)) {
        throw new Error('Secret TOTP inválido');
      }
      encryptedTotpSecret = TOTPService.encryptSecret(data.totpSecret, user.encryptionKeyHash);
    }

    
    const passwordEntry = await this.passwordRepository.create({
      userId,
      name: data.name,
      website: data.website,
      username: data.username,
      encryptedPassword,
      notes: data.notes,
      folder: data.folder,
      isFavorite: data.isFavorite || false,
      totpSecret: encryptedTotpSecret,
      totpEnabled: data.totpEnabled || false,
      customFields: data.customFields?.map(field => ({
        fieldName: field.fieldName,
        encryptedValue: CryptoUtil.encrypt(field.value, user.encryptionKeyHash),
        fieldType: field.fieldType
      })) || undefined
    });

    
    await AuditUtil.log(
      userId, 
      'PASSWORD_CREATED', 
      'PASSWORD_ENTRY', 
      passwordEntry.id, 
      { name: data.name }, 
      req
    );

    return this.decryptPasswordEntry(passwordEntry, user.encryptionKeyHash);
  }

  
  async updatePassword(
    userId: string, 
    passwordId: string, 
    data: UpdatePasswordEntryData, 
    req?: Request
  ): Promise<PasswordEntryDto | null> {
    
    const existingPassword = await this.passwordRepository.findById(passwordId, userId);

    if (!existingPassword) {
      return null;
    }

    
    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    
    const updateData: RepositoryUpdatePasswordEntryData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.folder !== undefined) updateData.folder = data.folder;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

    if (data.password) {
      updateData.encryptedPassword = CryptoUtil.encrypt(data.password, user.encryptionKeyHash);
    }

    if (data.totpSecret !== undefined) {
      if (data.totpSecret) {
        if (!TOTPService.isValidSecret(data.totpSecret)) {
          throw new Error('Secret TOTP inválido');
        }
        updateData.totpSecret = TOTPService.encryptSecret(data.totpSecret, user.encryptionKeyHash);
        updateData.totpEnabled = true;
      } else {
        updateData.totpSecret = undefined;
        updateData.totpEnabled = false;
      }
    }

    
    await this.passwordRepository.update(passwordId, updateData);

    
    if (data.customFields) {
      
      await this.passwordRepository.deleteCustomFieldsByPasswordEntryId(passwordId);

      
      for (const field of data.customFields) {
        await this.passwordRepository.createCustomField({
          passwordEntryId: passwordId,
          fieldName: field.fieldName,
          encryptedValue: CryptoUtil.encrypt(field.value, user.encryptionKeyHash),
          fieldType: field.fieldType
        });
      }
    }

    
    const finalPassword = await this.passwordRepository.findById(passwordId);

    
    await AuditUtil.log(
      userId, 
      'PASSWORD_UPDATED', 
      'PASSWORD_ENTRY', 
      passwordId, 
      { name: data.name }, 
      req
    );

    return this.decryptPasswordEntry(finalPassword!, user.encryptionKeyHash);
  }

  
  async deletePassword(userId: string, passwordId: string, req?: Request): Promise<boolean> {
    const password = await this.passwordRepository.findById(passwordId, userId);

    if (!password) {
      return false;
    }

    await this.passwordRepository.delete(passwordId);

    
    await AuditUtil.log(
      userId, 
      'PASSWORD_DELETED', 
      'PASSWORD_ENTRY', 
      passwordId, 
      { name: password.name }, 
      req
    );

    return true;
  }

  
  async generateSecurePassword(options: PasswordGeneratorOptions) {
    return PasswordUtil.generateSecurePassword(options);
  }

  
  async getUserFolders(userId: string): Promise<string[]> {
    const passwords = await this.passwordRepository.findByUserId(userId);
    
    const folders = passwords
      .map(item => item.folder)
      .filter(folder => folder)
      .sort();
    
    return [...new Set(folders)] as string[];
  }


  
  private async decryptPasswordEntry(password: PasswordEntry & { customFields?: CustomField[] }, encryptionKey: string): Promise<PasswordEntryDto> {
    const decryptedPassword = CryptoUtil.decrypt(password.encryptedPassword, encryptionKey);
    
    const decryptedCustomFields = password.customFields?.map((field: CustomField) => ({
      id: field.id,
      fieldName: field.fieldName,
      value: CryptoUtil.decrypt(field.encryptedValue, encryptionKey),
      fieldType: field.fieldType
    })) || [];

    
    let totpCode: TOTPCode | undefined;
    if (password.totpEnabled && password.totpSecret) {
      try {
        const decryptedTotpSecret = TOTPService.decryptSecret(password.totpSecret, encryptionKey);
        totpCode = TOTPService.generateCurrentCode(decryptedTotpSecret);
      } catch (error) {
      }
    }

    return {
      id: password.id,
      name: password.name,
      website: password.website || undefined,
      username: password.username || undefined,
      password: decryptedPassword,
      notes: password.notes || undefined,
      folder: password.folder || undefined,
      isFavorite: password.isFavorite,
      createdAt: password.createdAt,
      updatedAt: password.updatedAt,
      lastUsed: password.lastUsed || undefined,
      customFields: decryptedCustomFields,
      totpEnabled: password.totpEnabled,
      totpCode
    } as PasswordEntryDto;
  }
}
