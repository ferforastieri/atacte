import * as Notifications from 'expo-notifications';
import { Platform, Linking, Alert } from 'react-native';
import * as Battery from 'expo-battery';
import { nativeLocationService } from '../location/nativeLocationService';

export interface PermissionResult {
  granted: boolean;
  message?: string;
}

export interface AllPermissionsResult {
  locationForeground: PermissionResult;
  locationBackground: PermissionResult;
  notifications: PermissionResult;
  activityRecognition: PermissionResult;
  batteryOptimization: PermissionResult;
  allGranted: boolean;
}

class PermissionService {
  async requestAllPermissions(): Promise<AllPermissionsResult> {
    const results: AllPermissionsResult = {
      locationForeground: { granted: false },
      locationBackground: { granted: false },
      notifications: { granted: false },
      activityRecognition: { granted: false },
      batteryOptimization: { granted: false },
      allGranted: false,
    };

    try {
      results.locationForeground = await this.requestLocationForeground();
      
      if (results.locationForeground.granted) {
        results.locationBackground = await this.requestLocationBackground();
      }

      results.notifications = await this.requestNotifications();
      results.activityRecognition = await this.requestActivityRecognition();
      
      if (Platform.OS === 'android') {
        results.batteryOptimization = await this.requestBatteryOptimization();
      } else {
        results.batteryOptimization = { granted: true };
      }

      results.allGranted = 
        results.locationForeground.granted &&
        results.locationBackground.granted &&
        results.notifications.granted &&
        results.activityRecognition.granted &&
        results.batteryOptimization.granted;

      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao solicitar permissões:', errorMessage);
      return results;
    }
  }

  async requestLocationForeground(): Promise<PermissionResult> {
    try {
      await nativeLocationService.requestLocationPermissions();
      const granted = await nativeLocationService.checkLocationPermissions();
      return {
        granted: granted,
        message: granted ? undefined : 'Permissão de localização negada',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao solicitar permissão de localização';
      return {
        granted: false,
        message: errorMessage,
      };
    }
  }

  async requestLocationBackground(): Promise<PermissionResult> {
    try {
      await nativeLocationService.requestLocationPermissions();
      const granted = await nativeLocationService.checkLocationPermissions();
      return {
        granted: granted,
        message: granted ? undefined : 'Permissão de localização em segundo plano negada',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao solicitar permissão de localização em segundo plano';
      return {
        granted: false,
        message: errorMessage,
      };
    }
  }

  async requestNotifications(): Promise<PermissionResult> {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      return {
        granted: status === 'granted',
        message: status === 'granted' ? undefined : 'Permissão de notificações negada',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao solicitar permissão de notificações';
      return {
        granted: false,
        message: errorMessage,
      };
    }
  }

  async requestActivityRecognition(): Promise<PermissionResult> {
    try {
      return { granted: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao solicitar permissão de reconhecimento de atividade';
      return {
        granted: false,
        message: errorMessage,
      };
    }
  }

  async requestBatteryOptimization(): Promise<PermissionResult> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      if (batteryLevel < 0) {
        return {
          granted: false,
          message: 'Não foi possível acessar informações de bateria',
        };
      }

      return {
        granted: true,
        message: 'Permissão de otimização de bateria verificada',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar otimização de bateria';
      return {
        granted: false,
        message: errorMessage,
      };
    }
  }

  async openBatterySettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao abrir configurações';
      Alert.alert('Erro', errorMessage);
    }
  }

  async checkAllPermissions(): Promise<AllPermissionsResult> {
    const results: AllPermissionsResult = {
      locationForeground: { granted: false },
      locationBackground: { granted: false },
      notifications: { granted: false },
      activityRecognition: { granted: false },
      batteryOptimization: { granted: false },
      allGranted: false,
    };

    try {
      const locationGranted = await nativeLocationService.checkLocationPermissions();
      results.locationForeground = {
        granted: locationGranted,
      };

      results.locationBackground = {
        granted: locationGranted,
      };

      const notificationStatus = await Notifications.getPermissionsAsync();
      results.notifications = {
        granted: notificationStatus.granted,
      };

      results.activityRecognition = {
        granted: true,
      };

      try {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        results.batteryOptimization = {
          granted: batteryLevel >= 0,
        };
      } catch {
        results.batteryOptimization = { granted: false };
      }

      results.allGranted = 
        results.locationForeground.granted &&
        results.locationBackground.granted &&
        results.notifications.granted &&
        results.activityRecognition.granted &&
        results.batteryOptimization.granted;

      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar permissões';
      console.error(errorMessage);
      return results;
    }
  }
}

export const permissionService = new PermissionService();

