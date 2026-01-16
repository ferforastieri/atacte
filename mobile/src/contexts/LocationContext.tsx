import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { locationService, LocationData, FamilyMapData } from '../services/location/locationService';
import { nativeLocationService } from '../services/location/nativeLocationService';
import { geofenceService, GeofenceZone } from '../services/geofence/geofenceService';
import { notificationService } from '../services/notification/notificationService';
import { useAuth as useAuthContext } from './AuthContext';

interface LocationContextType {
  currentLocation: LocationData | null;
  isTrackingActive: boolean;
  isLoading: boolean;
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<void>;
  sendCurrentLocation: () => Promise<boolean>;
  getFamilyLocations: (familyId: string) => Promise<FamilyMapData | null>;
  refreshLocation: () => Promise<void>;
  checkAndStartTracking: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const { isAuthenticated } = useAuthContext();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const activeZones = useRef<Set<string>>(new Set());
  const lastCheckTime = useRef<number>(Date.now());

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      checkAndStartTracking();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const checkTrackingStatus = async () => {
      try {
        const isActive = await nativeLocationService.isTrackingActive();
        setIsTrackingActive(isActive);
      } catch (error) {
        console.error('Erro ao verificar status de rastreamento:', error);
      }
    };

    checkTrackingStatus();
    const interval = setInterval(checkTrackingStatus, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const initializeLocation = async () => {
    try {
      const isActive = await nativeLocationService.isTrackingActive();
      setIsTrackingActive(isActive);
      
      if (isAuthenticated) {
        await checkAndStartTracking();
      }

      await refreshLocation();
    } catch (error) {
      console.error('Erro ao inicializar localização:', error);
    }
  };

  const checkAndStartTracking = async () => {
    try {
      const permissionsGranted = await locationService.hasPermissions();
      
      if (!permissionsGranted) {
        setIsTrackingActive(false);
        return;
      }
      
      const isActive = await nativeLocationService.isTrackingActive();
      
      if (!isActive) {
        const started = await nativeLocationService.startTracking();
        setIsTrackingActive(started);
      } else {
        setIsTrackingActive(true);
      }
    } catch (error) {
      console.error('Erro ao verificar e iniciar rastreamento:', error);
      setIsTrackingActive(false);
    }
  };

  const refreshLocation = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const response = await locationService.getLatestLocation();
      
      if (response.success && response.data) {
        setCurrentLocation(response.data);
        
        const now = Date.now();
        if (now - lastCheckTime.current >= 30000) {
          try {
            await checkGeofenceZones(response.data);
            lastCheckTime.current = now;
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Erro ao verificar zonas de geofence:', errorMessage);
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Erro ao atualizar localização:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const refreshInterval = setInterval(() => {
      refreshLocation();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const checkGeofenceZones = async (location: LocationData) => {
    try {
      const zonesResponse = await geofenceService.getUserZones(true);
      
      if (!zonesResponse.success || !zonesResponse.data) {
        return;
      }

      const zones = zonesResponse.data;
      const currentlyInZones = new Set<string>();

      for (const zone of zones) {
        const isInZone = geofenceService.isPointInZone(
          location.latitude,
          location.longitude,
          zone
        );

        if (isInZone) {
          currentlyInZones.add(zone.id);
          if (!activeZones.current.has(zone.id) && zone.notifyOnEnter) {
            await sendGeofenceNotification(zone, 'enter');
          }
        } else {
          if (activeZones.current.has(zone.id) && zone.notifyOnExit) {
            await sendGeofenceNotification(zone, 'exit');
          }
        }
      }

      activeZones.current = currentlyInZones;
    } catch (error) {
      console.error('Erro ao verificar zonas de geofence:', error);
    }
  };

  const sendGeofenceNotification = async (zone: GeofenceZone, type: 'enter' | 'exit') => {
    try {
      await notifyFamilyAboutGeofence(zone, type);
    } catch (error) {
      console.error('Erro ao enviar notificação de geofence:', error);
    }
  };

  const notifyFamilyAboutGeofence = async (zone: GeofenceZone, type: 'enter' | 'exit') => {
    try {
      await notificationService.sendGeofenceNotification({
        zoneName: zone.name,
        eventType: type,
        zoneId: zone.id,
      });
    } catch (error) {
    }
  };

  const startTracking = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await nativeLocationService.startTracking();
      setIsTrackingActive(success);
      return success;
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await nativeLocationService.stopTracking();
      setIsTrackingActive(false);
    } catch (error) {
      console.error('Erro ao parar rastreamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendCurrentLocation = async (): Promise<boolean> => {
    try {
      // Enviar localização de interação
      const success = await nativeLocationService.sendInteractionLocation();
      
      if (success) {
        await refreshLocation();
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao enviar localização atual:', error);
      return false;
    }
  };

  const getFamilyLocations = async (familyId: string): Promise<FamilyMapData | null> => {
    try {
      const response = await locationService.getFamilyLocations(familyId);
      return response;
    } catch (error) {
      return null;
    }
  };

  const value = {
    currentLocation,
    isTrackingActive,
    isLoading,
    startTracking,
    stopTracking,
    sendCurrentLocation,
    getFamilyLocations,
    refreshLocation,
    checkAndStartTracking,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  
  return context;
}

