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

  async hasPermissions(): Promise<boolean> {
    try {
      return await nativeLocationService.checkLocationPermissions();
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  async getLatestLocation(): Promise<{ success: boolean; data?: LocationData }> {
    try {
      const response = await apiClient.get('/location/latest');
      
      if (response.data.success && response.data.data) {
        const loc = response.data.data;
        return {
          success: true,
          data: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            altitude: loc.altitude,
            altitudeAccuracy: null,
            heading: loc.heading,
            speed: loc.speed,
            timestamp: new Date(loc.timestamp).getTime(),
            batteryLevel: loc.batteryLevel,
            isCharging: loc.isCharging,
          },
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Erro ao buscar última localização:', error);
      return { success: false };
    }
  }

  async sendCurrentLocation(): Promise<boolean> {
    try {
      return await nativeLocationService.sendInteractionLocation();
    } catch (error) {
      console.error('Erro ao enviar localização atual:', error);
      return false;
    }
  }
}

export const locationService = new LocationService();

