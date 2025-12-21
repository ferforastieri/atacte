import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform, Linking, Alert, NativeModules } from 'react-native';
import * as Battery from 'expo-battery';
import { locationService } from '../location/locationService';
import { notificationService } from '../notification/notificationService';

const { ForegroundTracking } = NativeModules;

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      return {
        granted: status === 'granted',
        message: status === 'granted' ? undefined : 'Permissão de localização negada',
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
      const { status } = await Location.requestBackgroundPermissionsAsync();
      return {
        granted: status === 'granted',
        message: status === 'granted' ? undefined : 'Permissão de localização em segundo plano negada',
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
      if (Platform.OS === 'android') {
        if (ForegroundTracking && ForegroundTracking.requestActivityRecognition) {
          try {
            const granted = await new Promise<boolean>((resolve, reject) => {
              ForegroundTracking.requestActivityRecognition(
                (result: boolean) => resolve(result),
                (error: Error) => reject(error)
              );
            });
            
            if (!granted && Platform.Version >= 29) {
              try {
                await Linking.openSettings();
              } catch {
              }
            }
            
            return {
              granted: granted,
              message: granted ? undefined : 'Permissão de reconhecimento de atividade negada. Por favor, conceda nas configurações.',
            };
          } catch {
          }
        }
        
        return {
          granted: true,
          message: undefined,
        };
      } else {
        return { granted: true };
      }
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
      if (Platform.OS !== 'android') {
        return { granted: true };
      }

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
    if (Platform.OS === 'android') {
      try {
        await Linking.openSettings();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao abrir configurações';
        Alert.alert('Erro', errorMessage);
      }
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
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      results.locationForeground = {
        granted: foregroundStatus.granted,
      };

      const backgroundStatus = await Location.getBackgroundPermissionsAsync();
      results.locationBackground = {
        granted: backgroundStatus.granted,
      };

      const notificationStatus = await Notifications.getPermissionsAsync();
      results.notifications = {
        granted: notificationStatus.granted,
      };

      if (Platform.OS === 'android' && ForegroundTracking && ForegroundTracking.requestActivityRecognition) {
        try {
          const granted = await new Promise<boolean>((resolve, reject) => {
            ForegroundTracking.requestActivityRecognition(
              (result: boolean) => resolve(result),
              (error: Error) => reject(error)
            );
          });
          results.activityRecognition = {
            granted: granted,
          };
        } catch {
          results.activityRecognition = {
            granted: foregroundStatus.granted,
          };
        }
      } else {
        results.activityRecognition = {
          granted: foregroundStatus.granted,
        };
      }

      if (Platform.OS === 'android') {
        try {
          const batteryLevel = await Battery.getBatteryLevelAsync();
          results.batteryOptimization = {
            granted: batteryLevel >= 0,
          };
        } catch {
          results.batteryOptimization = { granted: false };
        }
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
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar permissões';
      console.error(errorMessage);
      return results;
    }
  }
}

export const permissionService = new PermissionService();

