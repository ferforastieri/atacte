import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CalendarEventForWidget {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  color?: string;
  isAllDay?: boolean;
}

class WidgetSyncService {
  async syncEvents(events: CalendarEventForWidget[]): Promise<void> {
    try {
      const eventsJson = JSON.stringify(events);
      await AsyncStorage.setItem('calendar_events', eventsJson);
      
      const { LocationModule, NativeLocation } = NativeModules;
      const LocationBridge = Platform.OS === 'ios' ? LocationModule : NativeLocation;
      
      if (LocationBridge?.saveCalendarEvents) {
        try {
          await new Promise<void>((resolve, reject) => {
            LocationBridge.saveCalendarEvents(
              eventsJson,
              () => resolve(),
              (error: Error) => reject(error)
            );
          });
        } catch (error) {
          console.warn('Erro ao salvar eventos no storage nativo:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar eventos com widget:', error);
    }
  }

  async clearEvents(): Promise<void> {
    try {
      await AsyncStorage.removeItem('calendar_events');
    } catch (error) {
      console.error('Erro ao limpar eventos do widget:', error);
    }
  }
}

export const widgetSyncService = new WidgetSyncService();

