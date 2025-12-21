import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { Platform } from 'react-native';
import { formatISO } from 'date-fns';
import apiClient from '../../lib/axios';

const getCurrentLocationWithRetry = async (
  options: Location.LocationOptions,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Location.LocationObject> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await Location.getCurrentPositionAsync({
        ...options,
        accuracy: Location.Accuracy.BestForNavigation,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('Falha ao obter localização após múltiplas tentativas');
};

export interface LocationData {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  timestamp: string;
  batteryLevel?: number;
  isMoving: boolean;
}

export interface FamilyMapData {
  familyId: string;
  familyName: string;
  members: FamilyMemberLocation[];
}

export interface FamilyMemberLocation {
  userId: string;
  userName: string;
  nickname: string | null;
  profilePicture: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  address: string | null;
  timestamp: string;
  batteryLevel: number | null;
  isMoving: boolean;
  lastInteraction?: string | null;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  batteryLevel?: number;
  isMoving?: boolean;
  triggerType?: string;
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;

  private async makeRequest<T = { success: boolean; data?: unknown; message?: string }>(
    endpoint: string, 
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      data?: unknown;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> {
    try {
      const response = await apiClient({
        url: endpoint,
        ...options,
      });
      return response.data as T;
    } catch (error: unknown) {
      const errorData = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: T } }).response?.data
        : undefined;
      return (errorData || { success: false, message: 'Erro de conexão' }) as T;
    }
  }

  async hasPermissions(): Promise<boolean> {
    try {
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      if (!foregroundStatus.granted) {
        return false;
      }

      const backgroundStatus = await Location.getBackgroundPermissionsAsync();
      if (!backgroundStatus.granted) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar permissões de localização:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<GeolocationPosition | null> {
    try {
      const location = await getCurrentLocationWithRetry({});

      return {
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? 0,
          altitude: location.coords.altitude ?? null,
          altitudeAccuracy: location.coords.altitudeAccuracy ?? null,
          heading: location.coords.heading ?? null,
          speed: location.coords.speed ?? null,
        },
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      return null;
    }
  }

  async getBatteryLevel(): Promise<number> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      return batteryLevel;
    } catch (error) {
      console.error('Erro ao obter nível de bateria:', error);
      return -1;
    }
  }

  async updateLocation(data: UpdateLocationRequest): Promise<{ success: boolean; data?: LocationData; message?: string }> {
    return this.makeRequest('/location', {
      method: 'POST',
      data,
    });
  }

  async getLatestLocation(): Promise<{ success: boolean; data?: LocationData; message?: string }> {
    return this.makeRequest('/location/latest');
  }

  async getLocationHistory(startDate: Date, endDate: Date, limit?: number): Promise<{ success: boolean; data?: LocationData[]; message?: string }> {
    const formatDateForAPI = (date: Date): string => {
      return formatISO(date)
    }

    const params: Record<string, string> = {
      startDate: formatDateForAPI(startDate),
      endDate: formatDateForAPI(endDate),
    };
    if (limit !== undefined) {
      params.limit = String(limit);
    }
    return this.makeRequest('/location/history', {
      params,
    });
  }

  async getMemberLocationHistory(userId: string, startDate: Date, endDate: Date, limit?: number): Promise<{ success: boolean; data?: LocationData[]; message?: string }> {
    const formatDateForAPI = (date: Date): string => {
      return formatISO(date)
    }

    const params: Record<string, string> = {
      startDate: formatDateForAPI(startDate),
      endDate: formatDateForAPI(endDate),
    };
    if (limit !== undefined) {
      params.limit = String(limit);
    }
    return this.makeRequest(`/location/history/${userId}`, {
      params,
    });
  }

  async getFamilyLocations(familyId: string): Promise<{ success: boolean; data?: FamilyMapData; message?: string }> {
    return this.makeRequest(`/location/family/${familyId}`);
  }

  async getLocationStats(): Promise<{ success: boolean; data?: { totalLocations: number; latestLocation: LocationData | null }; message?: string }> {
    return this.makeRequest('/location/stats');
  }

  async sendCurrentLocation(): Promise<boolean> {
    try {
      const location = await this.getCurrentLocation();
      
      if (!location) {
        return false;
      }

      const batteryLevel = await this.getBatteryLevel();

      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy > 0 ? location.coords.accuracy : undefined,
        altitude: location.coords.altitude ?? undefined,
        speed: location.coords.speed ?? undefined,
        heading: location.coords.heading ?? undefined,
        batteryLevel: batteryLevel >= 0 ? batteryLevel : undefined,
        isMoving: (location.coords.speed ?? 0) > 0.5 || (location.coords.heading !== null && location.coords.heading !== undefined),
      };

      const result = await this.updateLocation(payload);
      return result.success;
    } catch (error) {
      console.error('Erro ao enviar localização:', error);
      return false;
    }
  }

  startWatchingLocation(
    onLocationUpdate: (location: GeolocationPosition) => void,
    onError?: (error: Error | unknown) => void
  ): void {
    if (this.watchSubscription) {
      this.stopWatchingLocation();
    }

    const startWatchWithRetry = async (attempt: number = 0, maxRetries: number = 3): Promise<void> => {
      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 10,
            timeInterval: 30000,
          },
          (location) => {
            const position: GeolocationPosition = {
              coords: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || 0,
                altitude: location.coords.altitude || null,
                altitudeAccuracy: location.coords.altitudeAccuracy || null,
                heading: location.coords.heading || null,
                speed: location.coords.speed || null,
              },
              timestamp: location.timestamp,
            };
            onLocationUpdate(position);
          }
        );
        this.watchSubscription = subscription;
      } catch (error) {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          return startWatchWithRetry(attempt + 1, maxRetries);
        }
        console.error('Erro ao observar localização:', error);
        if (onError) {
          onError(error);
        }
      }
    };

    startWatchWithRetry();
  }

  stopWatchingLocation(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  async requestFamilyLocationUpdate(familyId: string): Promise<{ success: boolean; data?: LocationData; message?: string }> {
    try {
      const location = await this.getCurrentLocation();
      
      if (!location) {
        return { success: false, message: 'Não foi possível obter a localização atual' };
      }

      const batteryLevel = await this.getBatteryLevel();

      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy > 0 ? location.coords.accuracy : undefined,
        altitude: location.coords.altitude ?? undefined,
        speed: location.coords.speed ?? undefined,
        heading: location.coords.heading ?? undefined,
        batteryLevel: batteryLevel >= 0 ? batteryLevel : undefined,
        isMoving: (location.coords.speed ?? 0) > 0.5 || (location.coords.heading !== null && location.coords.heading !== undefined),
      };

      return this.makeRequest(`/location/request-update/${familyId}`, {
        method: 'POST',
        data: payload,
      });
    } catch (error) {
      console.error('Erro ao solicitar atualização de localização:', error);
      return { success: false, message: 'Erro ao solicitar atualização' };
    }
  }
}

export const locationService = new LocationService();
