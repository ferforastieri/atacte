import ForegroundService from 'react-native-foreground-service';
import { Platform } from 'react-native';
import { locationService } from './locationService';
import Geolocation from 'react-native-geolocation-service';
import * as Battery from 'expo-battery';

const LOCATION_SERVICE_ID = 'location-tracking-service';
const NOTIFICATION_ID = 1;

class ForegroundLocationService {
  private watchId: number | null = null;
  private isRunning: boolean = false;

  async start(): Promise<boolean> {
    try {
      if (this.isRunning) {
        return true;
      }

      if (Platform.OS === 'android') {
        await ForegroundService.createNotification({
          channelId: LOCATION_SERVICE_ID,
          id: NOTIFICATION_ID,
          title: 'Atacte - Rastreamento Ativo',
          text: 'Sua localização está sendo compartilhada com sua família',
          icon: 'ic_launcher',
          priority: 1,
        });

        await ForegroundService.startService({
          channelId: LOCATION_SERVICE_ID,
          id: NOTIFICATION_ID,
          title: 'Atacte - Rastreamento Ativo',
          text: 'Sua localização está sendo compartilhada com sua família',
          icon: 'ic_launcher',
          button: false,
        });
      }

      this.startLocationTracking();
      this.isRunning = true;
      return true;
    } catch (error) {
      console.error('Erro ao iniciar foreground service:', error);
      return false;
    }
  }

  async stop(): Promise<void> {
    try {
      if (!this.isRunning) {
        return;
      }

      this.stopLocationTracking();

      if (Platform.OS === 'android') {
        await ForegroundService.stopService();
      }

      this.isRunning = false;
    } catch (error) {
      console.error('Erro ao parar foreground service:', error);
    }
  }

  private startLocationTracking(): void {
    if (this.watchId !== null) {
      this.stopLocationTracking();
    }

    this.watchId = Geolocation.watchPosition(
      async (position) => {
        try {
          const batteryLevel = await Battery.getBatteryLevelAsync();
          
          const payload = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || undefined,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            batteryLevel: batteryLevel >= 0 ? batteryLevel : undefined,
            isMoving: position.coords.speed ? position.coords.speed > 0.5 : false,
          };

          await locationService.updateLocation(payload);

          if (Platform.OS === 'android') {
            await ForegroundService.updateNotification({
              channelId: LOCATION_SERVICE_ID,
              id: NOTIFICATION_ID,
              title: 'Atacte - Rastreamento Ativo',
              text: `Localização atualizada: ${new Date().toLocaleTimeString()}`,
              icon: 'ic_launcher',
              priority: 1,
            });
          }
        } catch (error) {
          console.error('Erro ao atualizar localização:', error);
        }
      },
      (error) => {
        console.error('Erro ao observar localização:', error);
      },
      {
        accuracy: {
          android: 'high',
          ios: 'best',
        },
        enableHighAccuracy: true,
        distanceFilter: 50,
        interval: 15000,
        fastestInterval: 10000,
        showsBackgroundLocationIndicator: true,
      }
    );
  }

  private stopLocationTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async isActive(): Promise<boolean> {
    return this.isRunning;
  }
}

export const foregroundLocationService = new ForegroundLocationService();

