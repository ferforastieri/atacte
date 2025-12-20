import { PrismaClient, CalendarEvent } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export interface CreateCalendarEventData {
  userId: string;
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

export interface UpdateCalendarEventData {
  title?: string;
  description?: string;
  startDate?: Date;
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

export interface SearchFilters {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface PaginationResult {
  items: CalendarEvent[];
  total: number;
  limit: number;
  offset: number;
}

export class CalendarRepository {
  async create(data: CreateCalendarEventData): Promise<CalendarEvent> {
    return await prisma.calendarEvent.create({
      data: {
        ...data,
        reminderMinutes: data.reminderMinutes || [],
        color: data.color || '#3b82f6',
        isAllDay: data.isAllDay || false,
      },
    });
  }

  async findById(id: string, userId?: string): Promise<CalendarEvent | null> {
    return await prisma.calendarEvent.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
    });
  }

  async search(filters: SearchFilters): Promise<PaginationResult> {
    const where: {
      userId: string;
      OR?: Array<Record<string, unknown>>;
    } = {
      userId: filters.userId,
    };

    if (filters.startDate || filters.endDate) {
      where.OR = [];
      
      if (filters.startDate && filters.endDate) {
        where.OR.push(
          {
            AND: [
              { recurrenceType: null },
              {
                startDate: {
                  gte: filters.startDate,
                  lte: filters.endDate,
                },
              },
            ],
          },
          {
            AND: [
              { recurrenceType: null },
              {
                endDate: {
                  gte: filters.startDate,
                  lte: filters.endDate,
                },
              },
            ],
          },
          {
            AND: [
              { recurrenceType: null },
              { startDate: { lte: filters.startDate } },
              { endDate: { gte: filters.endDate } },
            ],
          }
        );

        where.OR.push({
          AND: [
            { recurrenceType: { not: null } },
            {
              OR: [
                { startDate: { lte: filters.endDate } },
                { startDate: { gte: filters.startDate, lte: filters.endDate } },
              ],
            },
            {
              OR: [
                { recurrenceEndDate: null },
                { recurrenceEndDate: { gte: filters.startDate } },
              ],
            },
          ],
        });
      } else if (filters.startDate) {
        where.OR.push(
          {
            AND: [
              { recurrenceType: null },
              {
                OR: [
                  { startDate: { gte: filters.startDate } },
                  { endDate: { gte: filters.startDate } },
                ],
              },
            ],
          },
          {
            AND: [
              { recurrenceType: { not: null } },
              { startDate: { lte: filters.startDate } },
              {
                OR: [
                  { recurrenceEndDate: null },
                  { recurrenceEndDate: { gte: filters.startDate } },
                ],
              },
            ],
          }
        );
      } else if (filters.endDate) {
        where.OR.push(
          {
            AND: [
              { recurrenceType: null },
              {
                OR: [
                  { startDate: { lte: filters.endDate } },
                  { endDate: { lte: filters.endDate } },
                ],
              },
            ],
          },
          {
            AND: [
              { recurrenceType: { not: null } },
              { startDate: { lte: filters.endDate } },
              {
                OR: [
                  { recurrenceEndDate: null },
                  { recurrenceEndDate: { gte: filters.startDate || new Date(0) } },
                ],
              },
            ],
          }
        );
      }
    }

    const limit = filters.limit || 1000;
    const offset = filters.offset || 0;

    const [items, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        orderBy: {
          startDate: 'asc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.calendarEvent.count({ where }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async findByUserId(userId: string): Promise<CalendarEvent[]> {
    return await prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async findUpcomingEvents(): Promise<CalendarEvent[]> {
    return await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async update(id: string, data: UpdateCalendarEventData): Promise<CalendarEvent> {
    return await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.calendarEvent.delete({
      where: { id },
    });
  }
}

