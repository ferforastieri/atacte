import apiClient from '../../lib/axios';

export interface GeofenceZone {
  id: string;
  familyId: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGeofenceZoneData {
  familyId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter?: boolean;
  notifyOnExit?: boolean;
}

export interface UpdateGeofenceZoneData {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  isActive?: boolean;
  notifyOnEnter?: boolean;
  notifyOnExit?: boolean;
}

class GeofenceService {
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

  // Criar zona
  async createZone(data: CreateGeofenceZoneData): Promise<{ success: boolean; data?: GeofenceZone; message?: string }> {
    return this.makeRequest('/geofence/zones', {
      method: 'POST',
      data,
    });
  }

  // Listar zonas do usuário (todas as famílias) ou de uma família específica
  async getUserZones(activeOnly: boolean = false, familyId?: string): Promise<{ success: boolean; data?: GeofenceZone[]; message?: string }> {
    const params = new URLSearchParams();
    if (activeOnly) params.append('active', 'true');
    if (familyId) params.append('familyId', familyId);
    
    const queryString = params.toString();
    return this.makeRequest(`/geofence/zones${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  }

  // Atualizar zona
  async updateZone(id: string, data: UpdateGeofenceZoneData): Promise<{ success: boolean; data?: GeofenceZone; message?: string }> {
    return this.makeRequest(`/geofence/zones/${id}`, {
      method: 'PATCH',
      data,
    });
  }

  // Deletar zona
  async deleteZone(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/geofence/zones/${id}`, {
      method: 'DELETE',
    });
  }

  // Verificar se localização está em alguma zona
  async checkLocation(latitude: number, longitude: number): Promise<{ 
    success: boolean; 
    data?: { 
      inZones: boolean; 
      zones: { zone: GeofenceZone; distance: number }[] 
    }; 
    message?: string 
  }> {
    return this.makeRequest('/geofence/check', {
      method: 'POST',
      data: { latitude, longitude },
    });
  }

  // Calcular distância entre dois pontos (local)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Verificar se um ponto está dentro de uma zona (local)
  isPointInZone(latitude: number, longitude: number, zone: GeofenceZone): boolean {
    const distance = this.calculateDistance(latitude, longitude, zone.latitude, zone.longitude);
    return distance <= zone.radius;
  }
}

export const geofenceService = new GeofenceService();

