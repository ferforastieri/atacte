import { Request } from 'express';
import { NotificationRepository } from '../../repositories/notification/notificationRepository';
import { FamilyRepository } from '../../repositories/family/familyRepository';
import { Notification } from '../../../node_modules/.prisma/client';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

export interface NotificationDto {
  id: string;
  sender?: {
    id: string;
    name: string | null;
    email: string;
    profilePicture: string | null;
  };
  receiverId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  isSent: boolean;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface CreateNotificationData {
  senderId?: string;
  receiverId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendPushNotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
}

export class NotificationService {
  private notificationRepository: NotificationRepository;
  private familyRepository: FamilyRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.familyRepository = new FamilyRepository();
  }

  async createNotification(data: CreateNotificationData): Promise<NotificationDto> {
    const notification = await this.notificationRepository.create(data);
    
    // Enviar push notification
    await this.sendPushNotification(notification);

    return this.mapNotificationToDto(notification as any);
  }

  async getNotifications(
    userId: string,
    isRead?: boolean,
    limit?: number,
    offset?: number
  ): Promise<NotificationDto[]> {
    const notifications = await this.notificationRepository.findByReceiverId(userId, {
      isRead,
      limit,
      offset,
    });

    return notifications.map((notification) =>
      this.mapNotificationToDto(notification as any)
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.countUnreadByReceiverId(userId);
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationDto> {
    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification || notification.receiverId !== userId) {
      throw new Error('Notificação não encontrada');
    }

    const updated = await this.notificationRepository.markAsRead(notificationId);

    return this.mapNotificationToDto(updated as any);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return await this.notificationRepository.markAllAsReadByReceiverId(userId);
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification || notification.receiverId !== userId) {
      throw new Error('Notificação não encontrada');
    }

    await this.notificationRepository.delete(notificationId);
    
    return true;
  }

  // Notificações específicas do sistema

  async sendFamilyInviteNotification(
    inviterId: string,
    inviteeId: string,
    familyId: string,
    familyName: string
  ): Promise<void> {
    await this.createNotification({
      senderId: inviterId,
      receiverId: inviteeId,
      type: 'family_invite',
      title: 'Convite para Família',
      body: `Você foi convidado para se juntar à família "${familyName}"`,
      data: {
        familyId,
        familyName,
      },
    });
  }

  async sendMemberJoinedNotification(
    familyId: string,
    newMemberId: string,
    newMemberName: string
  ): Promise<void> {
    // Enviar notificação para todos os membros da família
    const family = await this.familyRepository.findById(familyId);
    
    if (!family) return;

    const notifications = family.members
      .filter((member) => member.userId !== newMemberId)
      .map((member) => ({
        senderId: newMemberId,
        receiverId: member.userId,
        type: 'member_joined',
        title: 'Novo Membro',
        body: `${newMemberName} entrou na família`,
        data: {
          familyId,
          newMemberId,
        },
      }));

    if (notifications.length > 0) {
      const createdNotifications = await this.notificationRepository.createBatchAndReturn(notifications);
      
      // Enviar push para cada notificação criada
      for (const notification of createdNotifications) {
        await this.sendPushNotification(notification);
      }
    }
  }

  async sendLowBatteryAlert(userId: string, batteryLevel: number): Promise<void> {
    const cooldownMinutes = parseInt(
      process.env.BATTERY_ALERT_COOLDOWN_MINUTES || '30',
      10
    );

    if (cooldownMinutes > 0) {
      const lastAlert = await this.notificationRepository.findLatestBySenderAndType(
        userId,
        'battery_low'
      );

      if (lastAlert) {
        const minutesSinceLastAlert =
          (Date.now() - new Date(lastAlert.createdAt).getTime()) / (1000 * 60);

        if (minutesSinceLastAlert < cooldownMinutes) {
          return;
        }
      }
    }

    // Enviar alerta para todos os membros das famílias do usuário
    const families = await this.familyRepository.findByUserId(userId);
    
    const notifications: CreateNotificationData[] = [];

    for (const family of families) {
      const senderMember = family.members.find((member) => member.userId === userId);
      const senderName =
        senderMember?.nickname ||
        senderMember?.user?.name ||
        senderMember?.user?.email ||
        'um membro da família';

      for (const member of family.members) {
        if (member.userId !== userId) {
          notifications.push({
            senderId: userId,
            receiverId: member.userId,
            type: 'battery_low',
            title: 'Bateria Baixa',
            body: `A bateria de ${senderName} está em ${Math.round(
              batteryLevel * 100
            )}%`,
            data: {
              userId,
              batteryLevel,
              familyId: family.id,
              userName: senderName,
            },
          });
        }
      }
    }

    if (notifications.length > 0) {
      const createdNotifications = await this.notificationRepository.createBatchAndReturn(notifications);
      
      // Enviar push para cada notificação criada
      for (const notification of createdNotifications) {
        await this.sendPushNotification(notification);
      }
    }
  }

  async sendSOSAlert(userId: string, latitude: number, longitude: number): Promise<void> {
    // Enviar SOS para todos os membros das famílias do usuário
    const families = await this.familyRepository.findByUserId(userId);
    
    const notifications: CreateNotificationData[] = [];

    for (const family of families) {
      for (const member of family.members) {
        if (member.userId !== userId) {
          notifications.push({
            senderId: userId,
            receiverId: member.userId,
            type: 'sos',
            title: '🆘 ALERTA DE EMERGÊNCIA',
            body: `${member.user.name || 'Um membro'} ativou um alerta de emergência!`,
            data: {
              userId,
              latitude,
              longitude,
              familyId: family.id,
            },
          });
        }
      }
    }

    if (notifications.length > 0) {
      const createdNotifications = await this.notificationRepository.createBatchAndReturn(notifications);
      
      // Enviar push para cada notificação criada
      for (const notification of createdNotifications) {
        await this.sendPushNotification(notification);
      }
    }
  }

  // Notificar família sobre geofencing
  async sendGeofenceToFamily(
    userId: string, 
    zoneName: string, 
    eventType: 'enter' | 'exit',
    zoneId: string
  ): Promise<void> {
    // Buscar todas as famílias do usuário
    const families = await this.familyRepository.findByUserId(userId);
    
    const notifications: CreateNotificationData[] = [];

    for (const family of families) {
      // Buscar o membro que entrou na zona para obter o nickname/apelido dele na família
      const senderMember = family.members.find((member) => member.userId === userId);
      const senderName =
        senderMember?.nickname ||
        senderMember?.user?.name ||
        senderMember?.user?.email ||
        'um membro da família';

      // Buscar todos os membros da família (exceto o próprio usuário) para notificar
      const members = family.members.filter((member) => member.userId !== userId);

      for (const member of members) {
        const title = eventType === 'enter' 
          ? `📍 ${senderName} chegou em ${zoneName}` 
          : `🚶 ${senderName} saiu de ${zoneName}`;
        
        const body = eventType === 'enter'
          ? `${senderName} entrou na zona ${zoneName}`
          : `${senderName} saiu da zona ${zoneName}`;

        notifications.push({
          senderId: userId,
          receiverId: member.userId,
          type: 'family_geofence',
          title,
          body,
          data: {
            userId,
            userName: senderName,
            zoneId,
            zoneName,
            eventType,
            familyId: family.id,
            familyName: family.name,
          },
        });
      }
    }

    if (notifications.length > 0) {
      const createdNotifications = await this.notificationRepository.createBatchAndReturn(notifications);
      
      // Enviar push para cada notificação criada
      for (const notification of createdNotifications) {
        await this.sendPushNotification(notification);
      }
    }
  }

  async cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
    return await this.notificationRepository.deleteOldNotifications(daysToKeep);
  }

  // Enviar push notification via Expo Push Notifications
  private async sendPushNotification(notification: Notification): Promise<void> {
    try {
      // Buscar o push token do receptor através do UserRepository
      const { UserRepository } = await import('../../repositories/users/userRepository');
      const userRepository = new UserRepository();
      
      const receiver = await userRepository.findById(notification.receiverId);
      
      if (!receiver || !receiver.pushToken) {
        return;
      }

      const pushToken = receiver.pushToken;
      
      if (!pushToken.startsWith('ExponentPushToken')) {
        console.warn(`Token inválido ignorado: ${pushToken}`);
        return;
      }

      // Usar Expo SDK para enviar notificações com chunks
      const expo = new Expo({
        useFcmV1: true,
      });

      if (!Expo.isExpoPushToken(pushToken)) {
        console.warn(`Token inválido ignorado: ${pushToken}`);
        return;
      }

      const payloadData: Record<string, any> = {
        ...(typeof notification.data === 'object' && notification.data !== null
          ? (notification.data as Record<string, any>)
          : {}),
        type: notification.type,
        notificationId: notification.id,
      };

      const message: ExpoPushMessage = {
        to: pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: payloadData,
        _contentAvailable: true,
      };

      const chunks = expo.chunkPushNotifications([message]);

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          
          // Marcar como enviado apenas se não houver erro
          const hasError = ticketChunk.some(ticket => 
            ticket.status === 'error' && ticket.details?.error !== 'DeviceNotRegistered'
          );
          
          if (!hasError) {
            await this.notificationRepository.markAsSent(notification.id);
          }
        } catch (error) {
          console.error('Erro ao enviar chunk de notificação:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar push notification:', error);
    }
  }

  private mapNotificationToDto(
    notification: Notification & {
      sender?: {
        id: string;
        name: string | null;
        email: string;
        profilePicture: string | null;
      };
    }
  ): NotificationDto {
    return {
      id: notification.id,
      sender: notification.sender,
      receiverId: notification.receiverId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, unknown> | undefined,
      isRead: notification.isRead,
      isSent: notification.isSent,
      sentAt: notification.sentAt || undefined,
      readAt: notification.readAt || undefined,
      createdAt: notification.createdAt,
    };
  }
}

