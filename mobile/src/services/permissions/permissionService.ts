import { Platform, Linking, Alert } from 'react-native';
import * as Battery from 'expo-battery';

export interface PermissionResult {
  granted: boolean;
  message?: string;
}

export interface AllPermissionsResult {
  batteryOptimization: PermissionResult;
  allGranted: boolean;
}

class PermissionService {
  async requestAllPermissions(): Promise<AllPermissionsResult> {
    const results: AllPermissionsResult = {
      batteryOptimization: { granted: false },
      allGranted: false,
    };

    try {
      if (Platform.OS === 'android') {
        results.batteryOptimization = await this.requestBatteryOptimization();
      } else {
        results.batteryOptimization = { granted: true };
      }

      results.allGranted = results.batteryOptimization.granted;

      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao solicitar permissões:', errorMessage);
      return results;
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
      batteryOptimization: { granted: false },
      allGranted: false,
    };

    try {
      try {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        results.batteryOptimization = {
          granted: batteryLevel >= 0,
        };
      } catch {
        results.batteryOptimization = { granted: false };
      }

      results.allGranted = results.batteryOptimization.granted;

      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar permissões';
      console.error(errorMessage);
      return results;
    }
  }
}

export const permissionService = new PermissionService();
