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
  familyId: string;
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
    familyId: string,
    data: Omit<CreateGeofenceZoneData, 'familyId'>,
    req?: Request
  ): Promise<GeofenceZoneDto> {
    // Verificar se o usuário é membro da família
    const isMember = await this.familyRepository.isUserMemberOfFamily(userId, familyId);
    if (!isMember) {
      throw new Error('Você não tem permissão para criar zonas nesta família');
    }

    const zone = await this.geofenceRepository.create({
      familyId,
      ...data,
    });

    // Log de auditoria
    await AuditUtil.log(
      userId,
      'GEOFENCE_ZONE_CREATED',
      'GEOFENCE_ZONE',
      zone.id,
      { name: data.name, familyId },
      req
    );

    return this.mapZoneToDto(zone);
  }

  async getFamilyZones(userId: string, familyId: string): Promise<GeofenceZoneDto[]> {
    // Verificar se o usuário é membro da família
    const isMember = await this.familyRepository.isUserMemberOfFamily(userId, familyId);
    if (!isMember) {
      throw new Error('Você não tem permissão para acessar zonas desta família');
    }

    const zones = await this.geofenceRepository.findByFamilyId(familyId);
    return zones.map((zone) => this.mapZoneToDto(zone));
  }

  async getActiveFamilyZones(userId: string, familyId: string): Promise<GeofenceZoneDto[]> {
    // Verificar se o usuário é membro da família
    const isMember = await this.familyRepository.isUserMemberOfFamily(userId, familyId);
    if (!isMember) {
      throw new Error('Você não tem permissão para acessar zonas desta família');
    }

    const zones = await this.geofenceRepository.findActiveByFamilyId(familyId);
    return zones.map((zone) => this.mapZoneToDto(zone));
  }

  async getActiveUserZones(userId: string): Promise<GeofenceZoneDto[]> {
    // Buscar todas as famílias do usuário e retornar todas as zonas ativas
    const families = await this.familyRepository.findByUserId(userId);
    const familyIds = families.map(f => f.id);

    if (familyIds.length === 0) {
      return [];
    }

    const zones = await this.geofenceRepository.findActiveByFamilyIds(familyIds);
    return zones.map((zone) => this.mapZoneToDto(zone));
  }

  async updateZone(
    userId: string,
    zoneId: string,
    data: UpdateGeofenceZoneData,
    req?: Request
  ): Promise<GeofenceZoneDto> {
    // Verificar se a zona existe e se o usuário é membro da família
    const zone = await this.geofenceRepository.findById(zoneId);
    if (!zone) {
      throw new Error('Zona não encontrada');
    }

    const isMember = await this.familyRepository.isUserMemberOfFamily(userId, zone.familyId);
    if (!isMember) {
      throw new Error('Você não tem permissão para editar esta zona');
    }

    const updatedZone = await this.geofenceRepository.update(zoneId, data);

    // Log de auditoria
    await AuditUtil.log(
      userId,
      'GEOFENCE_ZONE_UPDATED',
      'GEOFENCE_ZONE',
      updatedZone.id,
      data,
      req
    );

    return this.mapZoneToDto(updatedZone);
  }

  async deleteZone(userId: string, zoneId: string, req?: Request): Promise<void> {
    // Verificar se a zona existe e se o usuário é membro da família
    const zone = await this.geofenceRepository.findById(zoneId);
    if (!zone) {
      throw new Error('Zona não encontrada');
    }

    const isMember = await this.familyRepository.isUserMemberOfFamily(userId, zone.familyId);
    if (!isMember) {
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
    // Buscar todas as zonas ativas das famílias do usuário
    const zones = await this.getActiveUserZones(userId);
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
          zone,
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
    _currentLocation: { latitude: number; longitude: number }
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
      familyId: zone.familyId,
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

