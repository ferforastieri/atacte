import { prisma } from '../../infrastructure/prisma';
import { GeofenceZone } from '@prisma/client';

export interface CreateGeofenceZoneData {
  userId: string;
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
        userId: data.userId,
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

  async findByUserId(userId: string): Promise<GeofenceZone[]> {
    return prisma.geofenceZone.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByUserId(userId: string): Promise<GeofenceZone[]> {
    return prisma.geofenceZone.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByUserIds(userIds: string[]): Promise<GeofenceZone[]> {
    if (userIds.length === 0) {
      return [];
    }

    return prisma.geofenceZone.findMany({
      where: {
        userId: {
          in: userIds,
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

  async checkUserOwnership(id: string, userId: string): Promise<boolean> {
    const zone = await prisma.geofenceZone.findUnique({
      where: { id },
      select: { userId: true },
    });

    return zone?.userId === userId;
  }
}

