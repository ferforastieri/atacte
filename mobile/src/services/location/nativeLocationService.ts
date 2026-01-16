import { NativeModules, Platform } from 'react-native';

const { LocationModule, NativeLocation } = NativeModules;

const LocationBridge = Platform.OS === 'ios' ? LocationModule : NativeLocation;

export interface NativeLocationService {
  startTracking(): Promise<boolean>;
  stopTracking(): Promise<void>;
  isTrackingActive(): Promise<boolean>;
  saveAuthToken(token: string, apiUrl: string): Promise<boolean>;
  clearAuthToken(): Promise<boolean>;
  requestLocationPermissions(): Promise<boolean>;
  checkLocationPermissions(): Promise<boolean>;
  sendInteractionLocation(): Promise<boolean>;
}

class NativeLocationServiceImpl implements NativeLocationService {
  async startTracking(): Promise<boolean> {
    try {
      if (!LocationBridge) {
        console.error('LocationBridge não está disponível');
        return false;
      }
      const result = await LocationBridge.startTracking();
      return result === true;
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      if (!LocationBridge) {
        console.error('LocationBridge não está disponível');
        return;
      }
      await LocationBridge.stopTracking();
    } catch (error) {
      console.error('Erro ao parar rastreamento:', error);
    }
  }

  async isTrackingActive(): Promise<boolean> {
    try {
      if (!LocationBridge) {
        return false;
      }
      const result = await LocationBridge.isTrackingActive();
      return result === true;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return false;
    }
  }

  async saveAuthToken(token: string, apiUrl: string): Promise<boolean> {
    try {
      if (!LocationBridge) {
        console.error('LocationBridge não está disponível');
        return false;
      }
      await LocationBridge.saveAuthToken(token, apiUrl);
      return true;
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      return false;
    }
  }

  async clearAuthToken(): Promise<boolean> {
    try {
      if (!LocationBridge) {
        console.error('LocationBridge não está disponível');
        return false;
      }
      await LocationBridge.clearAuthToken();
      return true;
    } catch (error) {
      console.error('Erro ao limpar token:', error);
      return false;
    }
  }

  async requestLocationPermissions(): Promise<boolean> {
    try {
      if (!LocationBridge) {
        console.error('LocationBridge não está disponível');
        return false;
      }
      await LocationBridge.requestLocationPermissions();
      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  }

  async checkLocationPermissions(): Promise<boolean> {
    try {
      if (!LocationBridge) {
        return false;
      }
      const result = await LocationBridge.checkLocationPermissions();
      return result === true;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  async sendInteractionLocation(): Promise<boolean> {
    try {
      if (!LocationBridge) {
        console.error('LocationBridge não está disponível');
        return false;
      }
      if (LocationBridge.sendInteractionLocation) {
        await LocationBridge.sendInteractionLocation();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao enviar localização de interação:', error);
      return false;
    }
  }
}

export const nativeLocationService = new NativeLocationServiceImpl();

