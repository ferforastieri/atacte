import { nativeLocationService } from './nativeLocationService';

class ForegroundLocationService {
  private isActiveRef = false;

  async start(): Promise<boolean> {
    try {
      if (this.isActiveRef) {
        const isActive = await nativeLocationService.isTrackingActive();
        if (isActive) {
          return true;
        }
        this.isActiveRef = false;
      }

      // Verificar permissões
      const hasPermissions = await nativeLocationService.checkLocationPermissions();
      if (!hasPermissions) {
        console.error('Permissões de localização não concedidas');
        return false;
      }

      // Iniciar rastreamento
      const success = await nativeLocationService.startTracking();
      this.isActiveRef = success;
      return success;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Erro ao iniciar rastreamento:', errorMessage);
      this.isActiveRef = false;
      return false;
    }
  }

  async stop(): Promise<void> {
    try {
      await nativeLocationService.stopTracking();
      this.isActiveRef = false;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Erro ao parar rastreamento:', errorMessage);
      this.isActiveRef = false;
    }
  }

  async isActive(): Promise<boolean> {
    try {
      const isActive = await nativeLocationService.isTrackingActive();
      this.isActiveRef = isActive;
      return isActive;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Erro ao verificar status:', errorMessage);
      this.isActiveRef = false;
      return false;
    }
  }
}

export const foregroundLocationService = new ForegroundLocationService();
