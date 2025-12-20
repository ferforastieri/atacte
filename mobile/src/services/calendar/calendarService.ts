import apiClient from '../../lib/axios';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isAllDay: boolean;
  reminderMinutes: number[];
  color: string;
  location?: string;
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: string | null;
  recurrenceDaysOfWeek?: number[];
  recurrenceDayOfMonth?: number | null;
  recurrenceWeekOfMonth?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isAllDay?: boolean;
  reminderMinutes?: number[];
  color?: string;
  location?: string;
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: string | null;
  recurrenceDaysOfWeek?: number[];
  recurrenceDayOfMonth?: number | null;
  recurrenceWeekOfMonth?: number | null;
}

export interface UpdateCalendarEventRequest extends Partial<CreateCalendarEventRequest> {
  id: string;
}

export interface CalendarSearchFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface CalendarEventListResponse {
  success: boolean;
  data?: CalendarEvent[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
  message?: string;
}

interface CalendarEventResponse {
  success: boolean;
  data?: CalendarEvent;
  message?: string;
}

class CalendarService {
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

  async searchEvents(filters: CalendarSearchFilters = {}): Promise<CalendarEventListResponse> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = String(value);
      }
    });
    
    return this.makeRequest<CalendarEventListResponse>('/calendar', {
      method: 'GET',
      params,
    });
  }

  async getEventById(id: string): Promise<CalendarEventResponse> {
    return this.makeRequest<CalendarEventResponse>(`/calendar/${id}`, {
      method: 'GET',
    });
  }

  async createEvent(eventData: CreateCalendarEventRequest): Promise<CalendarEventResponse> {
    return this.makeRequest<CalendarEventResponse>('/calendar', {
      method: 'POST',
      data: eventData,
    });
  }

  async updateEvent(id: string, eventData: Partial<CreateCalendarEventRequest>): Promise<CalendarEventResponse> {
    return this.makeRequest<CalendarEventResponse>(`/calendar/${id}`, {
      method: 'PUT',
      data: eventData,
    });
  }

  async deleteEvent(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/calendar/${id}`, {
      method: 'DELETE',
    });
  }
}

export const calendarService = new CalendarService();

