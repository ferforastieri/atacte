import Geolocation from 'react-native-geolocation-service';
import * as Battery from 'expo-battery';
import { Platform, PermissionsAndroid } from 'react-native';
import apiClient from '../../lib/axios';

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
  private watchId: number | null = null;

  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    try {
      const response = await apiClient({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Erro de conexão' };
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const fineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permissão de Localização',
            message: 'Este app precisa da sua localização para compartilhar com sua família.',
            buttonNeutral: 'Perguntar Depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          }
        );

        if (fineLocation !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }

        if (Platform.Version >= 29) {
          const backgroundLocation = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Localização em Segundo Plano',
              message: 'Este app precisa da sua localização em segundo plano para mantê-lo conectado com sua família.',
              buttonNeutral: 'Perguntar Depois',
              buttonNegative: 'Cancelar',
              buttonPositive: 'OK',
            }
          );

          if (backgroundLocation !== PermissionsAndroid.RESULTS.GRANTED) {
            return false;
          }
        }
      } else {
        const authStatus = await Geolocation.requestAuthorization('whenInUse');
        if (authStatus !== 'granted') {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissões de localização:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve(position as GeolocationPosition);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          resolve(null);
        },
        {
          accuracy: {
            android: 'high',
            ios: 'best',
          },
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
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
    return this.makeRequest('/location/history', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit,
      },
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
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
        batteryLevel: batteryLevel >= 0 ? batteryLevel : undefined,
        isMoving: location.coords.speed ? location.coords.speed > 0.5 : false,
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
    onError?: (error: any) => void
  ): void {
    if (this.watchId !== null) {
      this.stopWatchingLocation();
    }

    this.watchId = Geolocation.watchPosition(
      (position) => {
        onLocationUpdate(position as GeolocationPosition);
      },
      (error) => {
        console.error('Erro ao observar localização:', error);
        if (onError) {
          onError(error);
        }
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

  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

export const locationService = new LocationService();
