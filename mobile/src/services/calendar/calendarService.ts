import apiClient from '../../lib/axios';
import { widgetSyncService } from './widgetSyncService';

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
    
    const response = await this.makeRequest<CalendarEventListResponse>('/calendar', {
      method: 'GET',
      params,
    });
    
    if (response.success && response.data) {
      widgetSyncService.syncEvents(response.data.map(event => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        color: event.color,
        isAllDay: event.isAllDay
      })));
    }
    
    return response;
  }

  async getEventById(id: string): Promise<CalendarEventResponse> {
    return this.makeRequest<CalendarEventResponse>(`/calendar/${id}`, {
      method: 'GET',
    });
  }

  async createEvent(eventData: CreateCalendarEventRequest): Promise<CalendarEventResponse> {
    const response = await this.makeRequest<CalendarEventResponse>('/calendar', {
      method: 'POST',
      data: eventData,
    });
    
    if (response.success) {
      await this.refreshWidgets();
    }
    
    return response;
  }

  async updateEvent(id: string, eventData: Partial<CreateCalendarEventRequest>): Promise<CalendarEventResponse> {
    const response = await this.makeRequest<CalendarEventResponse>(`/calendar/${id}`, {
      method: 'PUT',
      data: eventData,
    });
    
    if (response.success) {
      await this.refreshWidgets();
    }
    
    return response;
  }

  async deleteEvent(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.makeRequest(`/calendar/${id}`, {
      method: 'DELETE',
    });
    
    if (response.success) {
      await this.refreshWidgets();
    }
    
    return response;
  }

  private async refreshWidgets(): Promise<void> {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const response = await this.searchEvents({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString()
      });
      
      if (response.success && response.data) {
        await widgetSyncService.syncEvents(response.data.map(event => ({
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          color: event.color,
          isAllDay: event.isAllDay
        })));
      }
    } catch (error) {
      console.error('Erro ao atualizar widgets:', error);
    }
  }
}

export const calendarService = new CalendarService();

