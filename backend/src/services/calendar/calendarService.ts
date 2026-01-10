import { Request } from 'express';
import { CalendarEvent } from '../../infrastructure/prisma';
import { AuditUtil } from '../../utils/auditUtil';
import { CalendarRepository } from '../../repositories/calendar/calendarRepository';
import { NotificationService } from '../notification/notificationService';

export interface CalendarEventDto {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  isAllDay: boolean;
  reminderMinutes: number[];
  color: string;
  location?: string;
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: Date | null;
  recurrenceDaysOfWeek?: number[];
  recurrenceDayOfMonth?: number | null;
  recurrenceWeekOfMonth?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCalendarEventData {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  isAllDay?: boolean;
  reminderMinutes?: number[];
  color?: string;
  location?: string;
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: Date | null;
  recurrenceDaysOfWeek?: number[];
  recurrenceDayOfMonth?: number | null;
  recurrenceWeekOfMonth?: number | null;
}

export interface UpdateCalendarEventData extends Partial<CreateCalendarEventData> {}

export interface SearchFilters {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  events: CalendarEventDto[];
  total: number;
}

export class CalendarService {
  private calendarRepository: CalendarRepository;
  private notificationService: NotificationService;

  constructor() {
    this.calendarRepository = new CalendarRepository();
    this.notificationService = new NotificationService();
  }

  async searchEvents(userId: string, filters: SearchFilters): Promise<SearchResult> {
    const {
      startDate,
      endDate,
      limit,
      offset,
    } = filters;

    const searchStart = startDate || new Date();
    const searchEnd = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const searchFilters: {
      userId: string;
      startDate: Date;
      endDate: Date;
    } = {
      userId,
      startDate: searchStart,
      endDate: searchEnd,
    };

    const result = await this.calendarRepository.search(searchFilters);
    const allEvents = result.items.map(event => this.mapEventToDto(event));

    const expandedEvents: CalendarEventDto[] = [];
    const maxOccurrences = limit || 500;

    for (const event of allEvents) {
      if (event.recurrenceType && event.recurrenceType !== 'NONE') {
        const occurrences = this.expandRecurringEvent(event, searchStart, searchEnd, maxOccurrences);
        expandedEvents.push(...occurrences);
      } else {
        const eventStart = new Date(event.startDate);
        if (eventStart >= searchStart && eventStart <= searchEnd) {
          expandedEvents.push(event);
        }
      }
    }

    expandedEvents.sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    const paginatedEvents = expandedEvents.slice(offset || 0, (offset || 0) + (limit || 500));

    return {
      events: paginatedEvents,
      total: expandedEvents.length
    };
  }

  private expandRecurringEvent(
    event: CalendarEventDto,
    searchStart: Date,
    searchEnd: Date,
    maxOccurrences: number
  ): CalendarEventDto[] {
    const occurrences: CalendarEventDto[] = [];
    const originalStart = new Date(event.startDate);
    const originalEnd = event.endDate ? new Date(event.endDate) : null;
    const recurrenceEnd = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : null;
    const interval = event.recurrenceInterval || 1;

    const maxDate = recurrenceEnd 
      ? new Date(Math.min(recurrenceEnd.getTime(), searchEnd.getTime()))
      : searchEnd;

    const eventDuration = originalEnd 
      ? originalEnd.getTime() - originalStart.getTime()
      : 0;

    let occurrenceCount = 0;

    switch (event.recurrenceType) {
      case 'DAILY': {
        let iterDate = new Date(originalStart);
        
        while (iterDate <= maxDate && occurrenceCount < maxOccurrences) {
          if (iterDate >= searchStart && iterDate >= originalStart) {
            const occurrenceEnd = originalEnd 
              ? new Date(iterDate.getTime() + eventDuration)
              : null;

            occurrences.push({
              ...event,
              id: `${event.id}_${occurrenceCount}`,
              startDate: new Date(iterDate),
              endDate: occurrenceEnd || undefined,
            });
            occurrenceCount++;
          }

          iterDate = new Date(iterDate);
          iterDate.setDate(iterDate.getDate() + interval);
        }
        break;
      }

      case 'WEEKLY': {
        const daysOfWeek = event.recurrenceDaysOfWeek && event.recurrenceDaysOfWeek.length > 0
          ? event.recurrenceDaysOfWeek
          : [originalStart.getDay()];
        
        const startOfWeek = new Date(originalStart);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        let weekOffset = 0;
        while (occurrenceCount < maxOccurrences) {
          const weekStart = new Date(startOfWeek);
          weekStart.setDate(weekStart.getDate() + weekOffset * 7 * interval);

          if (weekStart > maxDate) break;

          for (const dayOfWeek of daysOfWeek) {
            const occurrenceDate = new Date(weekStart);
            occurrenceDate.setDate(occurrenceDate.getDate() + dayOfWeek);
            
            occurrenceDate.setHours(originalStart.getHours());
            occurrenceDate.setMinutes(originalStart.getMinutes());
            occurrenceDate.setSeconds(originalStart.getSeconds());

            if (occurrenceDate >= searchStart && occurrenceDate <= maxDate && occurrenceDate >= originalStart) {
              const occurrenceEnd = originalEnd 
                ? new Date(occurrenceDate.getTime() + eventDuration)
                : null;

              occurrences.push({
                ...event,
                id: `${event.id}_${occurrenceCount}`,
                startDate: new Date(occurrenceDate),
                endDate: occurrenceEnd || undefined,
              });
              occurrenceCount++;
              
              if (occurrenceCount >= maxOccurrences) break;
            }
          }

          weekOffset++;
          if (occurrenceCount >= maxOccurrences) break;
        }
        break;
      }

      case 'MONTHLY': {
        if (event.recurrenceDayOfMonth) {
          let year = originalStart.getFullYear();
          let month = originalStart.getMonth();
          
          while (occurrenceCount < maxOccurrences) {
            const occurrenceDate = new Date(
              year,
              month,
              event.recurrenceDayOfMonth,
              originalStart.getHours(),
              originalStart.getMinutes(),
              originalStart.getSeconds()
            );

            if (occurrenceDate > maxDate) break;

            if (occurrenceDate >= searchStart && occurrenceDate >= originalStart) {
              const occurrenceEnd = originalEnd 
                ? new Date(occurrenceDate.getTime() + eventDuration)
                : null;

              occurrences.push({
                ...event,
                id: `${event.id}_${occurrenceCount}`,
                startDate: new Date(occurrenceDate),
                endDate: occurrenceEnd || undefined,
              });
              occurrenceCount++;
            }

            month += interval;
            while (month >= 12) {
              month -= 12;
              year++;
            }
          }
        } else if (event.recurrenceWeekOfMonth && event.recurrenceDaysOfWeek && event.recurrenceDaysOfWeek.length > 0) {
          const weekOfMonth = event.recurrenceWeekOfMonth;
          const dayOfWeek = event.recurrenceDaysOfWeek[0];

          if (dayOfWeek !== undefined) {
            let year = originalStart.getFullYear();
            let month = originalStart.getMonth();
            
            while (occurrenceCount < maxOccurrences) {
              const firstDayOfMonth = new Date(year, month, 1);
              const firstDayOfWeek = firstDayOfMonth.getDay();
              
              let targetDate: Date;
              if (weekOfMonth === -1) {
                const lastDayOfMonth = new Date(year, month + 1, 0);
                const lastDayOfWeek = lastDayOfMonth.getDay();
                targetDate = new Date(lastDayOfMonth);
                targetDate.setDate(targetDate.getDate() - ((lastDayOfWeek - dayOfWeek + 7) % 7));
              } else {
                const daysToAdd = (dayOfWeek - firstDayOfWeek + 7) % 7 + (weekOfMonth - 1) * 7;
                targetDate = new Date(firstDayOfMonth);
                targetDate.setDate(targetDate.getDate() + daysToAdd);
              }

              targetDate.setHours(originalStart.getHours());
              targetDate.setMinutes(originalStart.getMinutes());
              targetDate.setSeconds(originalStart.getSeconds());

              if (targetDate > maxDate) break;

              if (targetDate >= searchStart && targetDate >= originalStart && targetDate.getMonth() === month) {
                const occurrenceEnd = originalEnd 
                  ? new Date(targetDate.getTime() + eventDuration)
                  : null;

                occurrences.push({
                  ...event,
                  id: `${event.id}_${occurrenceCount}`,
                  startDate: new Date(targetDate),
                  endDate: occurrenceEnd || undefined,
                });
                occurrenceCount++;
              }

              month += interval;
              while (month >= 12) {
                month -= 12;
                year++;
              }
            }
          }
        }
        break;
      }

      case 'YEARLY': {
        const startYear = searchStart.getFullYear();
        const endYear = maxDate.getFullYear();
        const originalMonth = originalStart.getMonth();
        const originalDay = originalStart.getDate();
        
        for (let year = startYear; year <= endYear && occurrenceCount < maxOccurrences; year += interval) {
          const occurrenceDate = new Date(
            year,
            originalMonth,
            originalDay,
            originalStart.getHours(),
            originalStart.getMinutes(),
            originalStart.getSeconds()
          );

          if (occurrenceDate >= searchStart && occurrenceDate <= maxDate && occurrenceDate >= originalStart) {
            const occurrenceEnd = originalEnd 
              ? new Date(occurrenceDate.getTime() + eventDuration)
              : null;

            occurrences.push({
              ...event,
              id: `${event.id}_${occurrenceCount}`,
              startDate: new Date(occurrenceDate),
              endDate: occurrenceEnd || undefined,
            });
            occurrenceCount++;
          }
        }
        break;
      }
    }

    return occurrences;
  }

  async getEventById(userId: string, eventId: string): Promise<CalendarEventDto | null> {
    const event = await this.calendarRepository.findById(eventId, userId);

    if (!event) {
      return null;
    }

    return this.mapEventToDto(event);
  }

  async createEvent(userId: string, data: CreateCalendarEventData, req?: Request): Promise<CalendarEventDto> {
    const calendarEvent = await this.calendarRepository.create({
      userId,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      isAllDay: data.isAllDay || false,
      reminderMinutes: data.reminderMinutes || [],
      color: data.color || '#3b82f6',
      location: data.location,
      recurrenceType: data.recurrenceType || null,
      recurrenceInterval: data.recurrenceInterval || null,
      recurrenceEndDate: data.recurrenceEndDate || null,
      recurrenceDaysOfWeek: data.recurrenceDaysOfWeek || [],
      recurrenceDayOfMonth: data.recurrenceDayOfMonth || null,
      recurrenceWeekOfMonth: data.recurrenceWeekOfMonth || null,
    });

    await AuditUtil.log(
      userId, 
      'CALENDAR_EVENT_CREATED', 
      'CALENDAR_EVENT', 
      calendarEvent.id, 
      { title: data.title }, 
      req
    );

    return this.mapEventToDto(calendarEvent);
  }

  async updateEvent(
    userId: string, 
    eventId: string, 
    data: UpdateCalendarEventData, 
    req?: Request
  ): Promise<CalendarEventDto | null> {
    const existingEvent = await this.calendarRepository.findById(eventId, userId);

    if (!existingEvent) {
      return null;
    }

    const updateData: UpdateCalendarEventData = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.isAllDay !== undefined) updateData.isAllDay = data.isAllDay;
    if (data.reminderMinutes !== undefined) updateData.reminderMinutes = data.reminderMinutes;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.recurrenceType !== undefined) updateData.recurrenceType = data.recurrenceType;
    if (data.recurrenceInterval !== undefined) updateData.recurrenceInterval = data.recurrenceInterval;
    if (data.recurrenceEndDate !== undefined) updateData.recurrenceEndDate = data.recurrenceEndDate;
    if (data.recurrenceDaysOfWeek !== undefined) updateData.recurrenceDaysOfWeek = data.recurrenceDaysOfWeek;
    if (data.recurrenceDayOfMonth !== undefined) updateData.recurrenceDayOfMonth = data.recurrenceDayOfMonth;
    if (data.recurrenceWeekOfMonth !== undefined) updateData.recurrenceWeekOfMonth = data.recurrenceWeekOfMonth;

    await this.calendarRepository.update(eventId, updateData);

    const finalEvent = await this.calendarRepository.findById(eventId);

    await AuditUtil.log(
      userId, 
      'CALENDAR_EVENT_UPDATED', 
      'CALENDAR_EVENT', 
      eventId, 
      { title: data.title }, 
      req
    );

    return this.mapEventToDto(finalEvent!);
  }

  async deleteEvent(userId: string, eventId: string, req?: Request): Promise<boolean> {
    const event = await this.calendarRepository.findById(eventId, userId);

    if (!event) {
      return false;
    }

    await this.calendarRepository.delete(eventId);

    await AuditUtil.log(
      userId, 
      'CALENDAR_EVENT_DELETED', 
      'CALENDAR_EVENT', 
      eventId, 
      { title: event.title }, 
      req
    );

    return true;
  }

  async checkAndSendReminders(): Promise<void> {
    const allEvents = await this.calendarRepository.findUpcomingEvents();
    
    const now = new Date();
    const sentReminders = new Set<string>();
    
    for (const event of allEvents) {
      if (!event.reminderMinutes || event.reminderMinutes.length === 0) {
        continue;
      }
      
      const eventStart = new Date(event.startDate);
      
      if (eventStart < now) {
        continue;
      }
      
      for (const minutes of event.reminderMinutes) {
        const reminderTime = new Date(eventStart.getTime() - minutes * 60 * 1000);
        
        const timeDiff = reminderTime.getTime() - now.getTime();
        const tolerance = 2 * 60 * 1000;
        
        const reminderKey = `${event.id}-${minutes}`;
        
        if (timeDiff >= 0 && timeDiff <= tolerance && !sentReminders.has(reminderKey)) {
          await this.sendEventReminder(event, minutes);
          sentReminders.add(reminderKey);
        }
      }
    }
  }

  private async sendEventReminder(event: CalendarEvent, reminderMinutes: number): Promise<void> {
    try {
      const { UserRepository } = await import('../../repositories/users/userRepository');
      const userRepository = new UserRepository();
      const user = await userRepository.findById(event.userId);
      
      if (!user) {
        return;
      }

      const startDate = new Date(event.startDate);
      const formattedDate = startDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const title = event.isAllDay 
        ? `📅 ${event.title} (Dia inteiro)`
        : `📅 ${event.title}`;
      
      let body = event.isAllDay
        ? `Lembrete: ${event.title} é hoje`
        : `Lembrete: ${event.title} às ${formattedDate}`;

      if (event.location) {
        body = `${body}\n📍 ${event.location}`;
      }
      
      if (reminderMinutes === 5) {
        body = `${body}\n⏰ Em 5 minutos`;
      } else if (reminderMinutes === 15) {
        body = `${body}\n⏰ Em 15 minutos`;
      } else if (reminderMinutes === 30) {
        body = `${body}\n⏰ Em 30 minutos`;
      } else if (reminderMinutes === 60) {
        body = `${body}\n⏰ Em 1 hora`;
      } else if (reminderMinutes === 1440) {
        body = `${body}\n⏰ Em 24 horas`;
      }

      await this.notificationService.createNotification({
        receiverId: event.userId,
        type: 'calendar_reminder',
        title,
        body,
        data: {
          eventId: event.id,
          eventTitle: event.title,
          startDate: event.startDate.toISOString(),
          isAllDay: event.isAllDay,
          location: event.location,
        },
      });
    } catch (error) {
      console.error('Erro ao enviar lembrete de evento:', error);
    }
  }

  private mapEventToDto(event: CalendarEvent): CalendarEventDto {
    return {
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      startDate: event.startDate,
      endDate: event.endDate || undefined,
      isAllDay: event.isAllDay,
      reminderMinutes: event.reminderMinutes,
      color: event.color,
      location: event.location || undefined,
      recurrenceType: event.recurrenceType || undefined,
      recurrenceInterval: event.recurrenceInterval || undefined,
      recurrenceEndDate: event.recurrenceEndDate || undefined,
      recurrenceDaysOfWeek: event.recurrenceDaysOfWeek || undefined,
      recurrenceDayOfMonth: event.recurrenceDayOfMonth || undefined,
      recurrenceWeekOfMonth: event.recurrenceWeekOfMonth || undefined,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}

