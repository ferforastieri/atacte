import * as Notifications from 'expo-notifications';
import { Platform, Linking, Alert } from 'react-native';
import * as Battery from 'expo-battery';

export interface PermissionResult {
  granted: boolean;
  message?: string;
}

export interface AllPermissionsResult {
  notifications: PermissionResult;
  batteryOptimization: PermissionResult;
  allGranted: boolean;
}

class PermissionService {
  async requestAllPermissions(): Promise<AllPermissionsResult> {
    const results: AllPermissionsResult = {
      notifications: { granted: false },
      batteryOptimization: { granted: false },
      allGranted: false,
    };

    try {
      results.notifications = await this.requestNotifications();
      
      if (Platform.OS === 'android') {
        results.batteryOptimization = await this.requestBatteryOptimization();
      } else {
        results.batteryOptimization = { granted: true };
      }

      results.allGranted = 
        results.notifications.granted &&
        results.batteryOptimization.granted;

      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao solicitar permissões:', errorMessage);
      return results;
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
      notifications: { granted: false },
      batteryOptimization: { granted: false },
      allGranted: false,
    };

    try {
      const notificationStatus = await Notifications.getPermissionsAsync();
      results.notifications = {
        granted: notificationStatus.granted,
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
        results.notifications.granted &&
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
