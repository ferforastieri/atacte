import { prisma } from '../../infrastructure/prisma';
import { GeofenceZone } from '@prisma/client';

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

export class GeofenceRepository {
  async create(data: CreateGeofenceZoneData): Promise<GeofenceZone> {
    return prisma.geofenceZone.create({
      data: {
        familyId: data.familyId,
        name: data.name,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius,
        notifyOnEnter: data.notifyOnEnter ?? true,
        notifyOnExit: data.notifyOnExit ?? true,
        isActive: true,
      },
    });
  }

  async findById(id: string): Promise<GeofenceZone | null> {
    return prisma.geofenceZone.findUnique({
      where: { id },
    });
  }

  async findByFamilyId(familyId: string): Promise<GeofenceZone[]> {
    return prisma.geofenceZone.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByFamilyId(familyId: string): Promise<GeofenceZone[]> {
    return prisma.geofenceZone.findMany({
      where: {
        familyId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByFamilyIds(familyIds: string[]): Promise<GeofenceZone[]> {
    if (familyIds.length === 0) {
      return [];
    }

    return prisma.geofenceZone.findMany({
      where: {
        familyId: {
          in: familyIds,
        },
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateGeofenceZoneData): Promise<GeofenceZone> {
    return prisma.geofenceZone.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.geofenceZone.delete({
      where: { id },
    });
  }
}

