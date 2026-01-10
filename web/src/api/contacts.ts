import api from './index';

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

export const contactsApi = {
  async searchContacts(filters?: ContactSearchFilters) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isFavorite !== undefined) params.append('isFavorite', String(filters.isFavorite));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await api.get(`/contacts?${params.toString()}`);
    return response.data;
  },

  async getContactById(id: string) {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  async createContact(data: CreateContactRequest) {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  async updateContact(id: string, data: UpdateContactRequest) {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
  },

  async deleteContact(id: string) {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },
};

