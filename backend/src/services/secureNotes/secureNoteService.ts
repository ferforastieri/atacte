import { Request } from 'express';
import { SecureNote } from '../../infrastructure/prisma';
import { CryptoUtil } from '../../utils/cryptoUtil';
import { AuditUtil } from '../../utils/auditUtil';
import { SecureNoteRepository, SearchFilters as RepositorySearchFilters, UpdateSecureNoteData as RepositoryUpdateSecureNoteData } from '../../repositories/secureNotes/secureNoteRepository';

export interface SecureNoteDto {
  id: string;
  title: string;
  content: string;
  folder?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSecureNoteData {
  title: string;
  content: string;
  folder?: string;
  isFavorite?: boolean;
}

export interface UpdateSecureNoteData extends Partial<CreateSecureNoteData> {}

export interface SearchFilters {
  query?: string;
  folder?: string;
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  notes: SecureNoteDto[];
  total: number;
}

export class SecureNoteService {
  private secureNoteRepository: SecureNoteRepository;

  constructor() {
    this.secureNoteRepository = new SecureNoteRepository();
  }

  async searchNotes(userId: string, filters: SearchFilters, _req?: Request): Promise<SearchResult> {
    const {
      query,
      folder,
      isFavorite,
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
    if (limit) searchFilters.limit = limit;
    if (offset) searchFilters.offset = offset;
    
    searchFilters.sortBy = sortBy || 'title';
    searchFilters.sortOrder = sortOrder || 'asc';

    const result = await this.secureNoteRepository.search(searchFilters);
    const notes = result.items;
    const total = result.total;

    const user = await this.secureNoteRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const decryptedNotes = [];
    for (const note of notes) {
      try {
        const decryptedNote = await this.decryptSecureNote(note, user.encryptionKeyHash);
        decryptedNotes.push(decryptedNote);
      } catch (error) {
        continue;
      }
    }

    return {
      notes: decryptedNotes,
      total
    };
  }

  async getNoteById(userId: string, noteId: string): Promise<SecureNoteDto | null> {
    const note = await this.secureNoteRepository.findById(noteId, userId);

    if (!note) {
      return null;
    }

    const user = await this.secureNoteRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return this.decryptSecureNote(note, user.encryptionKeyHash);
  }

  async createNote(userId: string, data: CreateSecureNoteData, req?: Request): Promise<SecureNoteDto> {
    const user = await this.secureNoteRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const encryptedContent = CryptoUtil.encrypt(data.content, user.encryptionKeyHash);

    const secureNote = await this.secureNoteRepository.create({
      userId,
      title: data.title,
      encryptedContent,
      folder: data.folder,
      isFavorite: data.isFavorite || false,
    });

    await AuditUtil.log(
      userId, 
      'NOTE_CREATED', 
      'SECURE_NOTE', 
      secureNote.id, 
      { title: data.title }, 
      req
    );

    return this.decryptSecureNote(secureNote, user.encryptionKeyHash);
  }

  async updateNote(
    userId: string, 
    noteId: string, 
    data: UpdateSecureNoteData, 
    req?: Request
  ): Promise<SecureNoteDto | null> {
    const existingNote = await this.secureNoteRepository.findById(noteId, userId);

    if (!existingNote) {
      return null;
    }

    const user = await this.secureNoteRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const updateData: RepositoryUpdateSecureNoteData = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.folder !== undefined) updateData.folder = data.folder;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

    if (data.content !== undefined) {
      updateData.encryptedContent = CryptoUtil.encrypt(data.content, user.encryptionKeyHash);
    }

    await this.secureNoteRepository.update(noteId, updateData);

    const finalNote = await this.secureNoteRepository.findById(noteId);

    await AuditUtil.log(
      userId, 
      'NOTE_UPDATED', 
      'SECURE_NOTE', 
      noteId, 
      { title: data.title }, 
      req
    );

    return this.decryptSecureNote(finalNote!, user.encryptionKeyHash);
  }

  async deleteNote(userId: string, noteId: string, req?: Request): Promise<boolean> {
    const note = await this.secureNoteRepository.findById(noteId, userId);

    if (!note) {
      return false;
    }

    await this.secureNoteRepository.delete(noteId);

    await AuditUtil.log(
      userId, 
      'NOTE_DELETED', 
      'SECURE_NOTE', 
      noteId, 
      { title: note.title }, 
      req
    );

    return true;
  }

  async getUserFolders(userId: string): Promise<string[]> {
    const notes = await this.secureNoteRepository.findByUserId(userId);
    
    const folders = notes
      .map(item => item.folder)
      .filter(folder => folder)
      .sort();
    
    return [...new Set(folders)] as string[];
  }

  private async decryptSecureNote(note: SecureNote, encryptionKey: string): Promise<SecureNoteDto> {
    const decryptedContent = CryptoUtil.decrypt(note.encryptedContent, encryptionKey);

    return {
      id: note.id,
      title: note.title,
      content: decryptedContent,
      folder: note.folder || undefined,
      isFavorite: note.isFavorite,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    } as SecureNoteDto;
  }
}

