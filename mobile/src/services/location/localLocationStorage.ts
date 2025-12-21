import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  isMoving: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'atacte_pending_locations';
const MAX_STORED_LOCATIONS = 1000;

class LocalLocationStorage {
  async saveLocation(location: Omit<StoredLocation, 'timestamp'>): Promise<void> {
    try {
      const storedLocation: StoredLocation = {
        ...location,
        timestamp: Date.now(),
      };

      const existing = await this.getStoredLocations();
      existing.push(storedLocation);

      if (existing.length > MAX_STORED_LOCATIONS) {
        existing.shift();
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Erro ao salvar localização local:', error);
    }
  }

  async getStoredLocations(): Promise<StoredLocation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as StoredLocation[];
    } catch (error) {
      console.error('Erro ao ler localizações locais:', error);
      return [];
    }
  }

  async clearStoredLocations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar localizações locais:', error);
    }
  }

  async getLocationCount(): Promise<number> {
    const locations = await this.getStoredLocations();
    return locations.length;
  }
}

export const localLocationStorage = new LocalLocationStorage();

