import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { Platform } from 'react-native';
import { formatISO } from 'date-fns';
import apiClient from '../../lib/axios';

const getBestLocationAccuracy = (): Location.Accuracy => {
  try {
    if (Location.Accuracy.BestForNavigation !== undefined) {
      return Location.Accuracy.BestForNavigation;
    }
    if (Location.Accuracy.Highest !== undefined) {
      return Location.Accuracy.Highest;
    }
    if (Location.Accuracy.High !== undefined) {
      return Location.Accuracy.High;
    }
    if (Location.Accuracy.Balanced !== undefined) {
      return Location.Accuracy.Balanced;
    }
    if (Location.Accuracy.Low !== undefined) {
      return Location.Accuracy.Low;
    }
    if (Location.Accuracy.Lowest !== undefined) {
      return Location.Accuracy.Lowest;
    }
    return Location.Accuracy.Balanced;
  } catch {
    return Location.Accuracy.Balanced;
  }
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
      const location = await Location.getCurrentPositionAsync({
        accuracy: getBestLocationAccuracy(),
      });

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

    Location.watchPositionAsync(
      {
        accuracy: getBestLocationAccuracy(),
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
    ).then((subscription) => {
      this.watchSubscription = subscription;
    }).catch((error) => {
      console.error('Erro ao observar localização:', error);
      if (onError) {
        onError(error);
      }
    });
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
