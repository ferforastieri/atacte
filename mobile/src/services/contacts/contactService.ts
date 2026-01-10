import apiClient from '../../lib/axios';

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

export interface Contact {
  id: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
  company?: string;
  jobTitle?: string;
  phoneNumbers: PhoneNumber[];
  emails: Email[];
  addresses: Address[];
  birthday?: string;
  notes?: string;
  imageUrl?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
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
  birthday?: string;
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

interface ContactListResponse {
  success: boolean;
  data?: Contact[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
  message?: string;
}

interface ContactResponse {
  success: boolean;
  data?: Contact;
  message?: string;
}

class ContactService {
  private async makeRequest<T = { success: boolean; data?: unknown; message?: string }>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      data?: unknown;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> {
    try {
      const response = await apiClient({
        url: endpoint,
        ...options,
      });
      return response.data as T;
    } catch (error: unknown) {
      const errorData = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: T } }).response?.data
        : undefined;
      return (errorData || { success: false, message: 'Erro de conexão' }) as T;
    }
  }

  async searchContacts(filters: ContactSearchFilters = {}): Promise<ContactListResponse> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = String(value);
      }
    });

    return this.makeRequest<ContactListResponse>('/contacts', {
      method: 'GET',
      params,
    });
  }

  async getContactById(id: string): Promise<ContactResponse> {
    return this.makeRequest<ContactResponse>(`/contacts/${id}`, {
      method: 'GET',
    });
  }

  async createContact(contactData: CreateContactRequest): Promise<ContactResponse> {
    return this.makeRequest<ContactResponse>('/contacts', {
      method: 'POST',
      data: contactData,
    });
  }

  async updateContact(id: string, contactData: UpdateContactRequest): Promise<ContactResponse> {
    return this.makeRequest<ContactResponse>(`/contacts/${id}`, {
      method: 'PUT',
      data: contactData,
    });
  }

  async deleteContact(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }
}

export const contactService = new ContactService();

