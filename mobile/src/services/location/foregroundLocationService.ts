import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { locationService, UpdateLocationRequest } from './locationService';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Erro na tarefa de localização:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];

    if (location) {
      try {
        const batteryLevel = await locationService.getBatteryLevel();
        
        const speed = location.coords.speed ?? 0;
        const isMoving = speed > 0.5 || (location.coords.heading !== null && location.coords.heading !== undefined);
        
        const payload: UpdateLocationRequest = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy && location.coords.accuracy > 0 ? location.coords.accuracy : undefined,
          altitude: location.coords.altitude ?? undefined,
          speed: speed > 0 ? speed : undefined,
          heading: location.coords.heading ?? undefined,
          batteryLevel: batteryLevel >= 0 ? batteryLevel : undefined,
          isMoving: isMoving,
        };

        const result = await locationService.updateLocation(payload);
        
        if (result.success) {
        } else {
          console.error('Erro ao enviar localização:', result.message);
        }
      } catch (error: any) {
        console.error('Erro ao enviar localização em background:', error?.message || error);
      }
    }
  }
});

class ForegroundLocationService {
  private isActiveRef = false;

  async start(): Promise<boolean> {
    try {
      if (this.isActiveRef) {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (hasStarted) {
          return true;
        }
        this.isActiveRef = false;
      }

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('Permissão de foreground não concedida');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.error('Permissão de background não concedida');
        return false;
      }

      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskDefined) {
        console.error('Tarefa não está definida');
        return false;
      }

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        this.isActiveRef = true;
        return true;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Highest, 
        timeInterval: 30000, 
        distanceInterval: 10, 
        foregroundService: {
          notificationTitle: 'Atacte',
          notificationBody: 'Rastreando localização',
          notificationColor: '#16a34a', 
        },
        pausesUpdatesAutomatically: false, 
        showsBackgroundLocationIndicator: true,
        deferredUpdatesInterval: 30000,
        deferredUpdatesDistance: 10,
        activityType: Location.ActivityType.OtherNavigation,
      });

      this.isActiveRef = true;
      return true;
    } catch (error: any) {
      console.error('Erro ao iniciar rastreamento:', error?.message || error);
      this.isActiveRef = false;
      return false;
    }
  }

  async stop(): Promise<void> {
    try {
      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (isTaskDefined) {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (hasStarted) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
      }

      this.isActiveRef = false;
    } catch (error: any) {
      console.error('Erro ao parar rastreamento:', error?.message || error);
      this.isActiveRef = false;
    }
  }

  async isActive(): Promise<boolean> {
    try {
      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskDefined) {
        this.isActiveRef = false;
        return false;
      }

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      this.isActiveRef = hasStarted;
      return hasStarted;
    } catch (error: any) {
      console.error('Erro ao verificar status:', error?.message || error);
      this.isActiveRef = false;
      return false;
    }
  }
}

export const foregroundLocationService = new ForegroundLocationService();

