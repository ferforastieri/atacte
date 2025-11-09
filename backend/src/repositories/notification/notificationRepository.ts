import { PrismaClient, Notification, Prisma } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  senderId?: string;
  receiverId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface UpdateNotificationData {
  isRead?: boolean;
  isSent?: boolean;
  sentAt?: Date;
  readAt?: Date;
}

export interface NotificationFilter {
  receiverId?: string;
  isRead?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}

export class NotificationRepository {
  async create(data: CreateNotificationData): Promise<Notification> {
    return await prisma.notification.create({
      data: {
        senderId: data.senderId || null,
        receiverId: data.receiverId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: (data.data || {}) as Prisma.InputJsonValue,
      },
    });
  }

  async createBatch(notifications: CreateNotificationData[]): Promise<number> {
    const result = await prisma.notification.createMany({
      data: notifications.map(n => ({
        senderId: n.senderId || null,
        receiverId: n.receiverId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: (n.data || {}) as Prisma.InputJsonValue,
      })),
    });

    return result.count;
  }

  async createBatchAndReturn(notifications: CreateNotificationData[]): Promise<Notification[]> {
    const createdNotifications = [];
    
    for (const n of notifications) {
      const notification = await prisma.notification.create({
        data: {
          senderId: n.senderId || null,
          receiverId: n.receiverId,
          type: n.type,
          title: n.title,
          body: n.body,
          data: (n.data || {}) as Prisma.InputJsonValue,
        },
      });
      createdNotifications.push(notification);
    }

    return createdNotifications;
  }

  async findById(id: string): Promise<Notification | null> {
    return await prisma.notification.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async findByReceiverId(
    receiverId: string,
    filter?: NotificationFilter
  ): Promise<Notification[]> {
    const where: any = { receiverId };

    if (filter?.isRead !== undefined) {
      where.isRead = filter.isRead;
    }

    if (filter?.type) {
      where.type = filter.type;
    }

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter?.limit || 50,
      skip: filter?.offset || 0,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async findUnreadByReceiverId(receiverId: string): Promise<Notification[]> {
    return this.findByReceiverId(receiverId, { isRead: false });
  }

  async countUnreadByReceiverId(receiverId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        receiverId,
        isRead: false,
      },
    });
  }

  async update(id: string, data: UpdateNotificationData): Promise<Notification> {
    return await prisma.notification.update({
      where: { id },
      data,
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsReadByReceiverId(receiverId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        receiverId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  async markAsSent(id: string): Promise<Notification> {
    return await prisma.notification.update({
      where: { id },
      data: {
        isSent: true,
        sentAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.notification.delete({
      where: { id },
    });
  }

  async deleteOldNotifications(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });

    return result.count;
  }

  async findPendingNotifications(limit?: number): Promise<Notification[]> {
    return await prisma.notification.findMany({
      where: {
        isSent: false,
      },
      orderBy: { createdAt: 'asc' },
      take: limit || 100,
      include: {
        receiver: {
          select: {
            id: true,
            pushToken: true,
          },
        },
      },
    });
  }

  async findLatestBySenderAndType(
    senderId: string,
    type: string
  ): Promise<Notification | null> {
    return await prisma.notification.findFirst({
      where: {
        senderId,
        type,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

