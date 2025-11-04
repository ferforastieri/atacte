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

// Configurar como as notificações devem ser exibidas
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
  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    try {
      const response = await apiClient({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Erro de conexão' };
    }
  }

  // Solicitar permissões de notificação
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissões de notificação:', error);
      return false;
    }
  }

  // Registrar push token
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '4ed359d6-b000-4308-84c0-18c93f60b0c6',
      });

      const token = tokenData.data;

      // Configurar canal de notificação para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Atacte',
          description: 'Notificações gerais do Atacte',
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
          sound: null, // Sem som
          showBadge: false,
          enableVibrate: false,
        });
      }

      // Enviar token para o servidor
      await this.updatePushToken(token);

      return token;
    } catch (error) {
      console.error('Erro ao registrar push token:', error);
      return null;
    }
  }

  // Atualizar push token no servidor
  async updatePushToken(pushToken: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest('/users/push-token', {
      method: 'PATCH',
      data: { pushToken },
    });
  }

  // Listar notificações
  async getNotifications(isRead?: boolean, limit?: number, offset?: number): Promise<{ success: boolean; data?: NotificationData[]; message?: string }> {
    return this.makeRequest('/notifications', {
      params: { isRead, limit, offset },
    });
  }

  // Obter contagem de não lidas
  async getUnreadCount(): Promise<{ success: boolean; data?: { count: number }; message?: string }> {
    return this.makeRequest('/notifications/unread-count');
  }

  // Marcar como lida
  async markAsRead(id: string): Promise<{ success: boolean; data?: NotificationData; message?: string }> {
    return this.makeRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  // Marcar todas como lidas
  async markAllAsRead(): Promise<{ success: boolean; data?: { count: number }; message?: string }> {
    return this.makeRequest('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // Deletar notificação
  async deleteNotification(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Enviar SOS
  async sendSOS(data: SendSOSRequest): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest('/notifications/sos', {
      method: 'POST',
      data,
    });
  }

  // Notificar família sobre geofencing
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

  // Exibir notificação local
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
        trigger: null, // Exibir imediatamente
      });
    } catch (error) {
      console.error('Erro ao exibir notificação local:', error);
    }
  }

  // Configurar listeners de notificação
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    // Listener para notificações recebidas enquanto o app está aberto
    if (onNotificationReceived) {
      Notifications.addNotificationReceivedListener(onNotificationReceived);
    }

    // Listener para quando o usuário toca na notificação
    if (onNotificationResponse) {
      Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
    }
  }

  // Cancelar todas as notificações agendadas
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erro ao cancelar notificações:', error);
    }
  }

  // Atualizar badge do app
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Erro ao atualizar badge:', error);
    }
  }
}

export const notificationService = new NotificationService();

