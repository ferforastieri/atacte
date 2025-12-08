import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService, NotificationData } from '../services/notification/notificationService';
import { useAuth as useAuthContext } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  sendSOS: (latitude: number, longitude: number) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
    }
  }, [isAuthenticated]);

  const initializeNotifications = async () => {
    try {
     
      await notificationService.registerForPushNotifications();

     
      notificationService.setupNotificationListeners(
        handleNotificationReceived,
        handleNotificationResponse
      );

     
      await refreshNotifications();
      await updateUnreadCount();
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
    }
  };

  const handleNotificationReceived = async (notification: Notifications.Notification) => {
    const data = notification.request.content.data as any;
    
   
    if (data?.type === 'location_update_request') {
      try {
       
        const { locationService } = await import('../services/location/locationService');
        await locationService.sendCurrentLocation();
      } catch (error) {
        console.error('Erro ao atualizar localização automaticamente:', error);
      }
    }
    
   
    refreshNotifications();
    updateUnreadCount();
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    
    const data = response.notification.request.content.data;
    
   
    if (data?.type === 'sos') {
     
    } else if (data?.type === 'family_invite') {
     
    } else if (data?.type === 'location_update_request') {
     
     
    }
  };

  const refreshNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications(undefined, 50, 0);
      
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
        
       
        await notificationService.setBadgeCount(response.data.count);
      }
    } catch (error) {
      console.error('Erro ao atualizar contagem:', error);
    }
  };

  const markAsRead = async (id: string): Promise<boolean> => {
    try {
      const response = await notificationService.markAsRead(id);
      
      if (response.success) {
        await refreshNotifications();
        await updateUnreadCount();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      return false;
    }
  };

  const markAllAsRead = async (): Promise<boolean> => {
    try {
      const response = await notificationService.markAllAsRead();
      
      if (response.success) {
        await refreshNotifications();
        await updateUnreadCount();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return false;
    }
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    try {
      const response = await notificationService.deleteNotification(id);
      
      if (response.success) {
        await refreshNotifications();
        await updateUnreadCount();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      return false;
    }
  };

  const sendSOS = async (latitude: number, longitude: number): Promise<boolean> => {
    try {
      const response = await notificationService.sendSOS({ latitude, longitude });
      
      if (response.success) {
       
        await notificationService.showLocalNotification(
          '🚨 SOS Enviado',
          'Sua família foi notificada sobre sua emergência!',
          { type: 'sos', latitude, longitude },
          'sos'
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao enviar SOS:', error);
      return false;
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendSOS,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
}

