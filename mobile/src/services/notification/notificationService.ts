import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiClient from '../../lib/axios';

export interface NotificationData {
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
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface SendSOSRequest {
  latitude: number;
  longitude: number;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
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

  async hasPermissions(): Promise<boolean> {
    try {
      const { granted } = await Notifications.getPermissionsAsync();
      return granted;
    } catch (error) {
      console.error('Erro ao verificar permissões de notificação:', error);
      return false;
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.hasPermissions();
      
      if (!hasPermission) {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '4ed359d6-b000-4308-84c0-18c93f60b0c6',
      });

      const token = tokenData.data;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Sentro',
          description: 'Notificações gerais do Sentro',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16a34a',
          sound: 'default',
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('family', {
          name: 'Família',
          description: 'Notificações da sua família',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16a34a',
          sound: 'default',
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('sos', {
          name: 'Emergência',
          description: 'Alertas de emergência da família',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#dc2626',
          sound: 'default',
          showBadge: true,
          enableVibrate: true,
        });


        await Notifications.setNotificationChannelAsync('location', {
          name: 'Localização',
          description: 'Rastreamento de localização em andamento',
          importance: Notifications.AndroidImportance.MAX,
          lightColor: '#16a34a',
          sound: null, 
          showBadge: false,
          enableVibrate: false,
        });
      }

      await this.updatePushToken(token);

      return token;
    } catch (error) {
      console.error('Erro ao registrar push token:', error);
      return null;
    }
  }

  async updatePushToken(pushToken: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest('/users/push-token', {
      method: 'PATCH',
      data: { pushToken },
    });
  }

  async getNotifications(isRead?: boolean, limit?: number, offset?: number): Promise<{ success: boolean; data?: NotificationData[]; message?: string }> {
    return this.makeRequest('/notifications', {
      params: { isRead, limit, offset },
    });
  }

  async getUnreadCount(): Promise<{ success: boolean; data?: { count: number }; message?: string }> {
    return this.makeRequest('/notifications/unread-count');
  }

  async markAsRead(id: string): Promise<{ success: boolean; data?: NotificationData; message?: string }> {
    return this.makeRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllAsRead(): Promise<{ success: boolean; data?: { count: number }; message?: string }> {
    return this.makeRequest('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async deleteNotification(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async sendSOS(data: SendSOSRequest): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest('/notifications/sos', {
      method: 'POST',
      data,
    });
  }

  async sendGeofenceNotification(data: {
    zoneName: string;
    eventType: 'enter' | 'exit';
    zoneId: string;
  }): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest('/notifications/geofence', {
      method: 'POST',
      data,
    });
  }

  async showLocalNotification(title: string, body: string, data?: Record<string, unknown>, channelId: string = 'default'): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
          ...(Platform.OS === 'android' && { 
            channelId,
            color: '#16a34a',
          }),
        },
        trigger: null, 
      });
    } catch (error) {
      console.error('Erro ao exibir notificação local:', error);
    }
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    if (onNotificationReceived) {
      Notifications.addNotificationReceivedListener(onNotificationReceived);
    }

    if (onNotificationResponse) {
      Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erro ao cancelar notificações:', error);
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Erro ao atualizar badge:', error);
    }
  }
}

export const notificationService = new NotificationService();

