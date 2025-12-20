import api from './index'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  isAllDay: boolean
  reminderMinutes: number[]
  color: string
  location?: string
  recurrenceType?: string | null
  recurrenceInterval?: number | null
  recurrenceEndDate?: string | null
  recurrenceDaysOfWeek?: number[]
  recurrenceDayOfMonth?: number | null
  recurrenceWeekOfMonth?: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateCalendarEventRequest {
  title: string
  description?: string
  startDate: string
  endDate?: string
  isAllDay?: boolean
  reminderMinutes?: number[]
  color?: string
  location?: string
  recurrenceType?: string | null
  recurrenceInterval?: number | null
  recurrenceEndDate?: string | null
  recurrenceDaysOfWeek?: number[]
  recurrenceDayOfMonth?: number | null
  recurrenceWeekOfMonth?: number | null
}

export interface UpdateCalendarEventRequest extends Partial<CreateCalendarEventRequest> {
  id: string
}

export interface CalendarSearchFilters {
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

const calendarApi = {
  async searchEvents(filters: CalendarSearchFilters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    
    const response = await api.get(`/calendar?${params.toString()}`)
    return response.data
  },

  async getEventById(id: string) {
    const response = await api.get(`/calendar/${id}`)
    return response.data
  },

  async createEvent(eventData: CreateCalendarEventRequest) {
    const response = await api.post('/calendar', eventData)
    return response.data
  },

  async updateEvent(id: string, eventData: Partial<CreateCalendarEventRequest>) {
    const response = await api.put(`/calendar/${id}`, eventData)
    return response.data
  },

  async deleteEvent(id: string) {
    const response = await api.delete(`/calendar/${id}`)
    return response.data
  },
}

export default calendarApi
export { calendarApi }

