import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { locationService, LocationData, FamilyMapData } from '../services/location/locationService';
import { familyService } from '../services/family/familyService';
import { geofenceService, GeofenceZone } from '../services/geofence/geofenceService';
import { notificationService } from '../services/notification/notificationService';
import * as Notifications from 'expo-notifications';
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
    if (isAuthenticated) {
      initializeLocation();
    } else {
     
      stopTracking();
    }
  }, [isAuthenticated]);

 
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTrackingStatus = async () => {
      try {
        const backgroundFunctions = (global as any).backgroundLocationFunctions;
        if (!backgroundFunctions) return;
        
        const isActive = await backgroundFunctions.isBackgroundLocationActive();
        if (!isActive && isTrackingActive) {
          await checkAndStartTracking();
        } else if (isActive && !isTrackingActive) {
          setIsTrackingActive(true);
        }
      } catch (error: any) {
        console.error('Erro ao verificar status de rastreamento:', error?.message || error);
      }
    };

    checkTrackingStatus();
    const interval = setInterval(checkTrackingStatus, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, isTrackingActive]);

  const initializeLocation = async () => {
    try {
      const backgroundFunctions = (global as any).backgroundLocationFunctions;
      if (!backgroundFunctions) {
        return;
      }
      
      const isActive = await backgroundFunctions.isBackgroundLocationActive();
      setIsTrackingActive(isActive);
      
      if (!isActive) {
        await checkAndStartTracking();
      }

      await refreshLocation();
    } catch (error) {
    }
  };

  const checkAndStartTracking = async () => {
    try {
      const permissionsGranted = await locationService.requestPermissions();
      
      if (!permissionsGranted) {
        setIsTrackingActive(false);
        return;
      }
      
      const response = await familyService.getFamilies();
      
      if (!response.success || !response.data || response.data.length === 0) {
        setIsTrackingActive(false);
        return;
      }
      
      const backgroundFunctions = (global as any).backgroundLocationFunctions;
      if (!backgroundFunctions) {
        setIsTrackingActive(false);
        return;
      }
      
      const isActive = await backgroundFunctions.isBackgroundLocationActive();
      
      if (isActive) {
        setIsTrackingActive(true);
        return;
      }
      
      const started = await backgroundFunctions.startBackgroundLocation();
      
      if (started) {
        setIsTrackingActive(true);
        try {
          await locationService.sendCurrentLocation();
        } catch (error: any) {
          console.error('Erro ao enviar localização inicial:', error?.message || error);
        }
      } else {
        setIsTrackingActive(false);
      }
    } catch (error: any) {
      console.error('Erro ao verificar e iniciar rastreamento:', error?.message || error);
      setIsTrackingActive(false);
    }
  };

  const refreshLocation = async () => {
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
          } catch (error: any) {
            console.error('Erro ao verificar zonas de geofence:', error?.message || error);
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao atualizar localização:', error?.message || error);
    } finally {
      setIsLoading(false);
    }
  };

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
    }
  };

  const sendGeofenceNotification = async (zone: GeofenceZone, type: 'enter' | 'exit') => {
    try {
     
      await notifyFamilyAboutGeofence(zone, type);
    } catch (error) {
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
      const backgroundFunctions = (global as any).backgroundLocationFunctions;
      if (!backgroundFunctions) {
        return false;
      }
      
      const success = await backgroundFunctions.startBackgroundLocation();
      
      if (success) {
        setIsTrackingActive(true);
        await sendCurrentLocation();
      }
      
      return success;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const backgroundFunctions = (global as any).backgroundLocationFunctions;
      if (!backgroundFunctions) {
        return;
      }
      
      await backgroundFunctions.stopBackgroundLocation();
      setIsTrackingActive(false);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const sendCurrentLocation = async (): Promise<boolean> => {
    try {
      const success = await locationService.sendCurrentLocation();
      
      if (success) {
        await refreshLocation();
      }
      
      return success;
    } catch (error) {
      return false;
    }
  };

  const getFamilyLocations = async (familyId: string): Promise<FamilyMapData | null> => {
    try {
      const response = await locationService.getFamilyLocations(familyId);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
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

