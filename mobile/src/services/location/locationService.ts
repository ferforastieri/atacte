import * as Battery from 'expo-battery';
import { Platform } from 'react-native';
import { formatISO } from 'date-fns';
import apiClient from '../../lib/axios';
import { nativeLocationService } from './nativeLocationService';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface FamilyMemberLocation {
  userId: string;
  userName: string;
  userProfilePicture?: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface FamilyMapData {
  members: FamilyMemberLocation[];
  lastUpdated: string;
}

class LocationService {
  async startTracking(): Promise<boolean> {
    try {
      return await nativeLocationService.startTracking();
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      await nativeLocationService.stopTracking();
    } catch (error) {
      console.error('Erro ao parar rastreamento:', error);
    }
  }

  async isTrackingActive(): Promise<boolean> {
    try {
      return await nativeLocationService.isTrackingActive();
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      // Nota: Esta é uma simulação - o location real vem do backend
      // via rastreamento em segundo plano
      return null;
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      return null;
    }
  }

  async sendLocationToServer(location: LocationData): Promise<boolean> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();
      
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude,
        altitudeAccuracy: location.altitudeAccuracy,
        heading: location.heading,
        speed: location.speed,
        timestamp: formatISO(new Date(location.timestamp)),
        batteryLevel: Math.round(batteryLevel * 100),
        isCharging: batteryState === Battery.BatteryState.CHARGING,
      };

      const response = await apiClient.post('/location', locationData);
      return response.data.success;
    } catch (error) {
      console.error('Erro ao enviar localização:', error);
      return false;
    }
  }

  async getFamilyLocations(familyId: string): Promise<FamilyMapData | null> {
    try {
      const response = await apiClient.get(`/location/family/${familyId}`);
      
      if (response.data.success) {
        return {
          members: response.data.data.members,
          lastUpdated: new Date().toISOString(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar localizações da família:', error);
      return null;
    }
  }

  async getUserLocationHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<LocationData[]> {
    try {
      const params: { startDate?: string; endDate?: string } = {};
      
      if (startDate) {
        params.startDate = formatISO(startDate);
      }
      
      if (endDate) {
        params.endDate = formatISO(endDate);
      }

      const response = await apiClient.get(`/location/user/${userId}/history`, { params });
      
      if (response.data.success) {
        return response.data.data.map((loc: any) => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          altitude: loc.altitude,
          altitudeAccuracy: loc.altitudeAccuracy,
          heading: loc.heading,
          speed: loc.speed,
          timestamp: new Date(loc.timestamp).getTime(),
          batteryLevel: loc.batteryLevel,
          isCharging: loc.isCharging,
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar histórico de localização:', error);
      return [];
    }
  }

  async getMemberCurrentLocation(userId: string): Promise<FamilyMemberLocation | null> {
    try {
      const response = await apiClient.get(`/location/user/${userId}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar localização do membro:', error);
      return null;
    }
  }
}

export const locationService = new LocationService();

