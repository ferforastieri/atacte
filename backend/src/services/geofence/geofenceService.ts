import { Request } from 'express';
import { GeofenceZone } from '@prisma/client';
import {
  GeofenceRepository,
  CreateGeofenceZoneData,
  UpdateGeofenceZoneData,
} from '../../repositories/geofence/geofenceRepository';
import { NotificationService } from '../notification/notificationService';
import { FamilyRepository } from '../../repositories/family/familyRepository';
import { AuditUtil } from '../../utils/auditUtil';

export interface GeofenceZoneDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GeofenceService {
  private geofenceRepository: GeofenceRepository;
  private notificationService: NotificationService;
  private familyRepository: FamilyRepository;

  constructor() {
    this.geofenceRepository = new GeofenceRepository();
    this.notificationService = new NotificationService();
    this.familyRepository = new FamilyRepository();
  }

  async createZone(
    userId: string,
    data: Omit<CreateGeofenceZoneData, 'userId'>,
    req?: Request
  ): Promise<GeofenceZoneDto> {
    const zone = await this.geofenceRepository.create({
      userId,
      ...data,
    });

    // Log de auditoria
    await AuditUtil.log(
      userId,
      'GEOFENCE_ZONE_CREATED',
      'GEOFENCE_ZONE',
      zone.id,
      { name: data.name },
      req
    );

    return this.mapZoneToDto(zone);
  }

  async getZoneById(userId: string, zoneId: string): Promise<GeofenceZoneDto | null> {
    const zone = await this.geofenceRepository.findById(zoneId);

    if (!zone) {
      return null;
    }

    // Verificar se o usuário é o dono
    if (zone.userId !== userId) {
      throw new Error('Você não tem permissão para acessar esta zona');
    }

    return this.mapZoneToDto(zone);
  }

  async getUserZones(userId: string): Promise<GeofenceZoneDto[]> {
    const zones = await this.geofenceRepository.findByUserId(userId);
    return zones.map((zone) => this.mapZoneToDto(zone));
  }

  async getActiveUserZones(userId: string): Promise<GeofenceZoneDto[]> {
    const userIdsToCheck = new Set<string>([userId]);

    try {
      const families = await this.familyRepository.findByUserId(userId);

      for (const family of families) {
        for (const member of family.members) {
          if (member.isActive) {
            userIdsToCheck.add(member.userId);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar membros da família para geofence:', error);
    }

    const zones = await this.geofenceRepository.findActiveByUserIds(
      Array.from(userIdsToCheck)
    );
    return zones.map((zone) => this.mapZoneToDto(zone));
  }

  async updateZone(
    userId: string,
    zoneId: string,
    data: UpdateGeofenceZoneData,
    req?: Request
  ): Promise<GeofenceZoneDto> {
    // Verificar propriedade
    const isOwner = await this.geofenceRepository.checkUserOwnership(zoneId, userId);
    if (!isOwner) {
      throw new Error('Você não tem permissão para editar esta zona');
    }

    const zone = await this.geofenceRepository.update(zoneId, data);

    // Log de auditoria
    await AuditUtil.log(
      userId,
      'GEOFENCE_ZONE_UPDATED',
      'GEOFENCE_ZONE',
      zone.id,
      data,
      req
    );

    return this.mapZoneToDto(zone);
  }

  async deleteZone(userId: string, zoneId: string, req?: Request): Promise<void> {
    // Verificar propriedade
    const isOwner = await this.geofenceRepository.checkUserOwnership(zoneId, userId);
    if (!isOwner) {
      throw new Error('Você não tem permissão para deletar esta zona');
    }

    await this.geofenceRepository.delete(zoneId);

    // Log de auditoria
    await AuditUtil.log(
      userId,
      'GEOFENCE_ZONE_DELETED',
      'GEOFENCE_ZONE',
      zoneId,
      null,
      req
    );
  }

  // Verificar se uma localização está dentro de alguma zona
  async checkLocationInZones(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<{ zone: GeofenceZoneDto; distance: number }[]> {
    const zones = await this.geofenceRepository.findActiveByUserId(userId);
    const zonesInRange: { zone: GeofenceZoneDto; distance: number }[] = [];

    for (const zone of zones) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        zone.latitude,
        zone.longitude
      );

      if (distance <= zone.radius) {
        zonesInRange.push({
          zone: this.mapZoneToDto(zone),
          distance,
        });
      }
    }

    return zonesInRange;
  }

  // Notificar entrada/saída de zona
  async handleZoneEvent(
    userId: string,
    zoneId: string,
    eventType: 'enter' | 'exit',
    currentLocation: { latitude: number; longitude: number }
  ): Promise<void> {
    const zone = await this.geofenceRepository.findById(zoneId);

    if (!zone || !zone.isActive) {
      return;
    }

    // Verificar se deve notificar
    const shouldNotify =
      (eventType === 'enter' && zone.notifyOnEnter) ||
      (eventType === 'exit' && zone.notifyOnExit);

    if (!shouldNotify) {
      return;
    }

    // Notificar a família sobre o evento de geofence
    await this.notificationService.sendGeofenceToFamily(
      userId,
      zone.name,
      eventType,
      zoneId
    );
  }

  // Calcular distância entre dois pontos (fórmula de Haversine)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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

  private mapZoneToDto(zone: GeofenceZone): GeofenceZoneDto {
    return {
      id: zone.id,
      userId: zone.userId,
      name: zone.name,
      description: zone.description,
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius: zone.radius,
      isActive: zone.isActive,
      notifyOnEnter: zone.notifyOnEnter,
      notifyOnExit: zone.notifyOnExit,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    };
  }
}

