import { Platform } from 'react-native';

let ExtensionStorage: any = null;

if (Platform.OS === 'ios') {
  try {
    const AppleTargets = require('@bacons/apple-targets');
    ExtensionStorage = AppleTargets.ExtensionStorage;
  } catch (error) {
    console.warn('@bacons/apple-targets not available');
  }
}

export interface CalendarEventForWidget {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  color?: string;
  isAllDay?: boolean;
}

class WidgetSyncService {
  private storage: any = null;

  constructor() {
    if (Platform.OS === 'ios' && ExtensionStorage) {
      try {
        this.storage = new ExtensionStorage('group.com.atacte.mobile');
      } catch (error) {
        console.error('Erro ao inicializar ExtensionStorage:', error);
      }
    }
  }

  async syncEvents(events: CalendarEventForWidget[]): Promise<void> {
    try {
      if (Platform.OS === 'ios' && this.storage) {
        await this.storage.set('calendar_events', JSON.stringify(events));
        ExtensionStorage.reloadWidget?.();
      } else if (Platform.OS === 'android') {
        const { SharedPreferencesModule } = require('react-native').NativeModules;
        if (SharedPreferencesModule) {
          await SharedPreferencesModule.setString('calendar_events', JSON.stringify(events));
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar eventos com widget:', error);
    }
  }

  async clearEvents(): Promise<void> {
    try {
      if (Platform.OS === 'ios' && this.storage) {
        await this.storage.remove('calendar_events');
        ExtensionStorage.reloadWidget?.();
      } else if (Platform.OS === 'android') {
        const { SharedPreferencesModule } = require('react-native').NativeModules;
        if (SharedPreferencesModule) {
          await SharedPreferencesModule.remove('calendar_events');
        }
      }
    } catch (error) {
      console.error('Erro ao limpar eventos do widget:', error);
    }
  }
}

export const widgetSyncService = new WidgetSyncService();

