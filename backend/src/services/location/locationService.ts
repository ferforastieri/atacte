import { Request } from 'express';
import { AuditUtil } from '../../utils/auditUtil';
import { LocationRepository, FamilyMemberLocation } from '../../repositories/location/locationRepository';
import { FamilyRepository } from '../../repositories/family/familyRepository';
import { NotificationService } from '../notification/notificationService';
import { GeofenceService } from '../geofence/geofenceService';
import { Location } from '../../../node_modules/.prisma/client';

export interface LocationDto {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  timestamp: Date;
  batteryLevel?: number;
  isMoving: boolean;
}

export interface CreateLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  batteryLevel?: number;
  isMoving?: boolean;
}

export interface FamilyMapData {
  familyId: string;
  familyName: string;
  members: FamilyMemberLocationDto[];
}

export interface FamilyMemberLocationDto {
  userId: string;
  userName: string;
  nickname: string | null;
  profilePicture: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  address: string | null;
  timestamp: Date;
  batteryLevel: number | null;
  isMoving: boolean;
}

export class LocationService {
  private locationRepository: LocationRepository;
  private familyRepository: FamilyRepository;
  private notificationService: NotificationService;
  private geofenceService: GeofenceService;

  constructor() {
    this.locationRepository = new LocationRepository();
    this.familyRepository = new FamilyRepository();
    this.notificationService = new NotificationService();
    this.geofenceService = new GeofenceService();
  }

  async updateLocation(
    userId: string,
    data: CreateLocationData,
    req?: Request
  ): Promise<LocationDto> {
    const previousLocation = await this.locationRepository.findLatestByUserId(userId);

    const location = await this.locationRepository.create({
      userId,
      ...data,
    });

    // Verificar alertas (bateria baixa, etc)
    if (data.batteryLevel && data.batteryLevel < 0.15) {
      await this.notificationService.sendLowBatteryAlert(userId, data.batteryLevel);
    }

    await this.processGeofenceEvents(userId, data, previousLocation);

    // Log de auditoria (apenas para debug, não para todas as localizações)
    if (process.env.LOG_LOCATIONS === 'true') {
      await AuditUtil.log(
        userId,
        'LOCATION_UPDATED',
        'LOCATION',
        location.id,
        null,
        req
      );
    }

    return this.mapLocationToDto(location);
  }

  private async processGeofenceEvents(
    userId: string,
    data: CreateLocationData,
    previousLocation: Location | null
  ): Promise<void> {
    try {
      const currentZones = await this.geofenceService.checkLocationInZones(
        userId,
        data.latitude,
        data.longitude
      );

      const previousZones = previousLocation
        ? await this.geofenceService.checkLocationInZones(
            userId,
            Number(previousLocation.latitude),
            Number(previousLocation.longitude)
          )
        : [];

      if (currentZones.length === 0 && previousZones.length === 0) {
        return;
      }

      const currentZoneIds = new Set(currentZones.map(({ zone }) => zone.id));
      const previousZoneIds = new Set(previousZones.map(({ zone }) => zone.id));

      for (const { zone } of currentZones) {
        if (!previousZoneIds.has(zone.id)) {
          await this.geofenceService.handleZoneEvent(userId, zone.id, 'enter', {
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
      }

      for (const { zone } of previousZones) {
        if (!currentZoneIds.has(zone.id)) {
          await this.geofenceService.handleZoneEvent(userId, zone.id, 'exit', {
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao processar eventos de geofence:', error);
    }
  }

  async getLatestLocation(userId: string): Promise<LocationDto | null> {
    const location = await this.locationRepository.findLatestByUserId(userId);
    
    if (!location) {
      return null;
    }

    return this.mapLocationToDto(location);
  }

  async getLocationHistory(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<LocationDto[]> {
    const locations = await this.locationRepository.getLocationHistory(
      userId,
      startDate,
      endDate,
      limit
    );

    return locations.map((location) => this.mapLocationToDto(location));
  }

  async getFamilyLocations(
    userId: string,
    familyId: string
  ): Promise<FamilyMapData> {
    // Verificar se o usuário é membro da família
    const isMember = await this.familyRepository.isUserMemberOfFamily(
      userId,
      familyId
    );
    
    if (!isMember) {
      throw new Error('Você não tem permissão para acessar esta família');
    }

    // Buscar informações da família
    const family = await this.familyRepository.findById(familyId);
    
    if (!family) {
      throw new Error('Família não encontrada');
    }

    // Buscar localizações dos membros
    const locations = await this.locationRepository.getFamilyMembersLocations(
      familyId
    );

    return {
      familyId: family.id,
      familyName: family.name,
      members: locations
        .filter((loc) => loc.latitude !== null && loc.longitude !== null)
        .map((loc) => ({
          userId: loc.userId,
          userName: loc.userName || 'Usuário',
          nickname: loc.nickname,
          profilePicture: loc.profilePicture,
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          speed: loc.speed,
          address: loc.address,
          timestamp: loc.timestamp,
          batteryLevel: loc.batteryLevel,
          isMoving: loc.isMoving,
        })),
    };
  }

  async cleanupOldLocations(userId: string, daysToKeep: number = 30): Promise<number> {
    return await this.locationRepository.deleteOldLocations(userId, daysToKeep);
  }

  async getLocationStats(userId: string): Promise<{
    totalLocations: number;
    latestLocation: LocationDto | null;
  }> {
    const [totalLocations, latestLocation] = await Promise.all([
      this.locationRepository.countLocationsByUser(userId),
      this.locationRepository.findLatestByUserId(userId),
    ]);

    return {
      totalLocations,
      latestLocation: latestLocation ? this.mapLocationToDto(latestLocation) : null,
    };
  }

  async requestFamilyLocationUpdate(
    userId: string,
    familyId: string,
    locationData: CreateLocationData,
    req?: Request
  ): Promise<LocationDto> {
    // Verificar se o usuário é membro da família
    const isMember = await this.familyRepository.isUserMemberOfFamily(
      userId,
      familyId
    );
    
    if (!isMember) {
      throw new Error('Você não tem permissão para acessar esta família');
    }

    // Atualizar localização do usuário que solicitou
    const location = await this.updateLocation(userId, locationData, req);

    // Buscar todos os membros da família (exceto o próprio usuário)
    const members = await this.familyRepository.getFamilyMembers(familyId);
    
    // Buscar informações do usuário que solicitou
    const { UserRepository } = await import('../../repositories/users/userRepository');
    const userRepository = new UserRepository();
    const requestingUser = await userRepository.findById(userId);

    // Criar notificações para os outros membros
    const notifications = members
      .filter((member) => member.userId !== userId)
      .map((member) => ({
        senderId: userId,
        receiverId: member.userId,
        type: 'location_update_request',
        title: 'Atualização de Localização Solicitada',
        body: `${requestingUser?.name || 'Um membro'} solicitou uma atualização de localização`,
        data: {
          familyId,
          requestingUserId: userId,
          requestingUserName: requestingUser?.name || 'Um membro',
        },
      }));

    if (notifications.length > 0) {
      // Usar createNotification que já envia push automaticamente
      for (const notificationData of notifications) {
        await this.notificationService.createNotification(notificationData);
      }
    }

    return location;
  }

  private mapLocationToDto(location: Location): LocationDto {
    return {
      id: location.id,
      userId: location.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || undefined,
      altitude: location.altitude || undefined,
      speed: location.speed || undefined,
      heading: location.heading || undefined,
      address: location.address || undefined,
      timestamp: location.timestamp,
      batteryLevel: location.batteryLevel || undefined,
      isMoving: location.isMoving,
    };
  }
}

