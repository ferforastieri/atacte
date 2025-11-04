import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { locationService, UpdateLocationRequest } from './locationService';

const LOCATION_TASK_NAME = 'background-location-task';

// Definir a tarefa em background
// Esta tarefa roda automaticamente quando o app está em background
// Ela coleta a localização e usa o locationService para enviar ao backend
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
        // Obter nível de bateria
        const batteryLevel = await locationService.getBatteryLevel();
        
        // Preparar dados para enviar (usando o mesmo formato do locationService)
        const payload: UpdateLocationRequest = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy && location.coords.accuracy > 0 ? location.coords.accuracy : undefined,
          altitude: location.coords.altitude ?? undefined,
          speed: location.coords.speed ?? undefined,
          heading: location.coords.heading ?? undefined,
          batteryLevel: batteryLevel >= 0 ? batteryLevel : undefined,
          isMoving: location.coords.speed ? location.coords.speed > 0.5 : false,
        };

        // Usar o locationService para enviar (ele faz POST para /location no backend)
        const result = await locationService.updateLocation(payload);
        
        if (result.success) {
        } else {
          console.error('Erro ao enviar localização:', result.message);
        }
      } catch (error) {
        console.error('Erro ao enviar localização em background:', error);
      }
    }
  }
});

class ForegroundLocationService {
  private isActiveRef = false;

  async start(): Promise<boolean> {
    try {
      // Verificar se já está ativo
      if (this.isActiveRef) {
        return true;
      }

      // Solicitar permissões
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

      // Verificar se a tarefa já está registrada
      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskDefined) {
        console.error('Tarefa não está definida');
        return false;
      }

      // Iniciar atualização de localização em background
      // O foregroundService garante que o rastreamento continue mesmo em background (Android)
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Highest, // Precisão máxima
        timeInterval: 30000, // 30 segundos (obrigatório)
        distanceInterval: 0, // 0 = não usar filtro de distância, apenas tempo (garante atualização a cada 30s)
        foregroundService: {
          notificationTitle: 'Atacte',
          notificationBody: 'Rastreando localização',
          notificationColor: '#16a34a', // Verde
        },
        pausesUpdatesAutomatically: false, // Não pausar automaticamente
        showsBackgroundLocationIndicator: true, // Mostrar indicador no iOS
        // Android: foregroundService garante execução mesmo com app em background
        // iOS: showsBackgroundLocationIndicator mostra que está rastreando
      });

      this.isActiveRef = true;
      return true;
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error);
      this.isActiveRef = false;
      return false;
    }
  }

  async stop(): Promise<void> {
    try {
      if (!this.isActiveRef) {
        return;
      }

      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (isTaskDefined) {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (hasStarted) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
      }

      this.isActiveRef = false;
    } catch (error) {
      console.error('Erro ao parar rastreamento:', error);
      this.isActiveRef = false;
    }
  }

  async isActive(): Promise<boolean> {
    try {
      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskDefined) {
        return false;
      }

      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      this.isActiveRef = hasStarted;
      return hasStarted;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return false;
    }
  }
}

export const foregroundLocationService = new ForegroundLocationService();

