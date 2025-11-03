declare module 'react-native-foreground-service' {
  interface NotificationConfig {
    channelId: string;
    id: number;
    title: string;
    text: string;
    icon?: string;
    priority?: number;
    button?: boolean;
  }

  interface ServiceConfig extends NotificationConfig {
    button?: boolean;
  }

  class ForegroundService {
    static createNotification(config: NotificationConfig): Promise<void>;
    static startService(config: ServiceConfig): Promise<void>;
    static stopService(): Promise<void>;
    static updateNotification(config: NotificationConfig): Promise<void>;
  }

  export default ForegroundService;
}

