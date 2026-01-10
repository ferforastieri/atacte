import { Request } from 'express';
import { Contact } from '../../infrastructure/prisma';
import { AuditUtil } from '../../utils/auditUtil';
import { 
  ContactRepository, 
  PhoneNumber, 
  Email, 
  Address,
  CreateContactData,
  UpdateContactData,
  SearchFilters 
} from '../../repositories/contacts/contactRepository';

export interface ContactDto {
  id: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
  company?: string;
  jobTitle?: string;
  phoneNumbers: PhoneNumber[];
  emails: Email[];
  addresses: Address[];
  birthday?: Date;
  notes?: string;
  imageUrl?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactRequest {
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

export interface UpdateContactRequest extends Partial<CreateContactRequest> {}

export interface ContactSearchFilters {
  search?: string;
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  contacts: ContactDto[];
  total: number;
}

export class ContactService {
  private contactRepository: ContactRepository;

  constructor() {
    this.contactRepository = new ContactRepository();
  }

  async searchContacts(userId: string, filters: ContactSearchFilters): Promise<SearchResult> {
    const searchFilters: SearchFilters = {
      userId,
      ...filters,
    };

    const result = await this.contactRepository.search(searchFilters);

    return {
      contacts: result.items.map(contact => this.mapContactToDto(contact)),
      total: result.total,
    };
  }

  async getContactById(userId: string, contactId: string): Promise<ContactDto | null> {
    const contact = await this.contactRepository.findById(contactId, userId);

    if (!contact) {
      return null;
    }

    return this.mapContactToDto(contact);
  }

  async createContact(userId: string, data: CreateContactRequest, req?: Request): Promise<ContactDto> {
    const contactData: CreateContactData = {
      userId,
      ...data,
    };

    const contact = await this.contactRepository.create(contactData);

    await AuditUtil.log(
      userId,
      'CONTACT_CREATED',
      'CONTACT',
      contact.id,
      { firstName: data.firstName, lastName: data.lastName },
      req
    );

    return this.mapContactToDto(contact);
  }

  async updateContact(
    userId: string,
    contactId: string,
    data: UpdateContactRequest,
    req?: Request
  ): Promise<ContactDto | null> {
    const existingContact = await this.contactRepository.findById(contactId, userId);

    if (!existingContact) {
      return null;
    }

    const updateData: UpdateContactData = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
    if (data.phoneNumbers !== undefined) updateData.phoneNumbers = data.phoneNumbers;
    if (data.emails !== undefined) updateData.emails = data.emails;
    if (data.addresses !== undefined) updateData.addresses = data.addresses;
    if (data.birthday !== undefined) updateData.birthday = data.birthday;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

    const updatedContact = await this.contactRepository.update(contactId, updateData);

    await AuditUtil.log(
      userId,
      'CONTACT_UPDATED',
      'CONTACT',
      contactId,
      { firstName: data.firstName, lastName: data.lastName },
      req
    );

    return this.mapContactToDto(updatedContact);
  }

  async deleteContact(userId: string, contactId: string, req?: Request): Promise<boolean> {
    const contact = await this.contactRepository.findById(contactId, userId);

    if (!contact) {
      return false;
    }

    await this.contactRepository.delete(contactId);

    await AuditUtil.log(
      userId,
      'CONTACT_DELETED',
      'CONTACT',
      contactId,
      { firstName: contact.firstName, lastName: contact.lastName },
      req
    );

    return true;
  }

  private mapContactToDto(contact: Contact): ContactDto {
    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName || undefined,
      nickname: contact.nickname || undefined,
      company: contact.company || undefined,
      jobTitle: contact.jobTitle || undefined,
      phoneNumbers: (contact.phoneNumbers as any) || [],
      emails: (contact.emails as any) || [],
      addresses: (contact.addresses as any) || [],
      birthday: contact.birthday || undefined,
      notes: contact.notes || undefined,
      imageUrl: contact.imageUrl || undefined,
      isFavorite: contact.isFavorite,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }
}

