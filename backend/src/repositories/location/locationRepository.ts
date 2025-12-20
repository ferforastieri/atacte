import { PrismaClient, Location } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export interface CreateLocationData {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  batteryLevel?: number;
  isMoving?: boolean;
  triggerType?: string;
}

export interface LocationFilter {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface FamilyMemberLocation {
  userId: string;
  userName: string | null;
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
  lastInteraction?: Date | null;
}

export class LocationRepository {
  async create(data: CreateLocationData): Promise<Location> {
    return await prisma.location.create({
      data,
    });
  }

  async findLatestByUserId(userId: string): Promise<Location | null> {
    return await prisma.location.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByUserId(userId: string, filter?: LocationFilter): Promise<Location[]> {
    const where: {
      userId: string;
      timestamp?: {
        gte?: Date;
        lte?: Date;
      };
    } = { userId };

    if (filter?.startDate || filter?.endDate) {
      where.timestamp = {};
      if (filter.startDate) {
        where.timestamp.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.timestamp.lte = filter.endDate;
      }
    }

    return await prisma.location.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filter?.limit || 100,
    });
  }

  async findLatestByUserIds(userIds: string[]): Promise<Location[]> {
    const locations = await prisma.$queryRaw<Location[]>`
      SELECT DISTINCT ON (user_id) *
      FROM locations
      WHERE user_id = ANY(${userIds})
      ORDER BY user_id, timestamp DESC
    `;

    return locations;
  }

  async getFamilyMembersLocations(familyId: string): Promise<FamilyMemberLocation[]> {
    const result = await prisma.$queryRaw<Array<{
      userId: string;
      userName: string | null;
      nickname: string | null;
      profilePicture: string | null;
      latitude: number | null;
      longitude: number | null;
      accuracy: number | null;
      speed: number | null;
      address: string | null;
      timestamp: Date | null;
      batteryLevel: number | null;
      isMoving: boolean | null;
    }>>`
      SELECT DISTINCT ON (fm.user_id)
        fm.user_id as "userId",
        u.name as "userName",
        fm.nickname,
        u.profile_picture as "profilePicture",
        l.latitude,
        l.longitude,
        l.accuracy,
        l.speed,
        l.address,
        l.timestamp,
        l.battery_level as "batteryLevel",
        l.is_moving as "isMoving"
      FROM family_members fm
      INNER JOIN users u ON fm.user_id = u.id
      LEFT JOIN locations l ON l.user_id = fm.user_id
      WHERE fm.family_id = ${familyId}
        AND fm.is_active = true
        AND fm.share_location = true
        AND fm.show_on_map = true
      ORDER BY fm.user_id, l.timestamp DESC NULLS LAST
    `;

    const filtered = result.filter((loc) => loc.latitude !== null && loc.longitude !== null);

    const userIds = filtered.map((loc) => loc.userId);

    const interactions = userIds.length > 0 ? await prisma.$queryRaw<Array<{
      user_id: string;
      timestamp: Date;
    }>>`
      SELECT DISTINCT ON (user_id)
        user_id,
        timestamp
      FROM locations
      WHERE user_id = ANY(${userIds})
        AND trigger_type IN ('UNLOCK', 'INTERACTION')
      ORDER BY user_id, timestamp DESC
    ` : [];

    const interactionMap = new Map<string, Date>();
    interactions.forEach((interaction) => {
      interactionMap.set(interaction.user_id, interaction.timestamp);
    });

    return filtered.map((loc) => ({
      userId: loc.userId,
      userName: loc.userName || 'Usuário',
      nickname: loc.nickname,
      profilePicture: loc.profilePicture,
      latitude: loc.latitude!,
      longitude: loc.longitude!,
      accuracy: loc.accuracy,
      speed: loc.speed,
      address: loc.address,
      timestamp: loc.timestamp!,
      batteryLevel: loc.batteryLevel,
      isMoving: loc.isMoving || false,
      lastInteraction: interactionMap.get(loc.userId) || null,
    }));
  }

  async deleteOldLocations(userId: string, daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.location.deleteMany({
      where: {
        userId,
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  async getLocationHistory(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<Location[]> {
    const allLocations = await prisma.location.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit ? limit * 10 : 10000,
    });

    if (allLocations.length === 0) {
      return [];
    }

    const filteredLocations: Location[] = [];
    const minDistanceMeters = 100;

    for (const location of allLocations) {
      if (location.latitude === null || location.longitude === null) {
        continue;
      }

      if (filteredLocations.length === 0) {
        filteredLocations.push(location);
        continue;
      }

      const lastLocation = filteredLocations[filteredLocations.length - 1];
      if (!lastLocation || lastLocation.latitude === null || lastLocation.longitude === null) {
        filteredLocations.push(location);
        continue;
      }

      const distance = this.calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        location.latitude,
        location.longitude
      );

      if (distance >= minDistanceMeters) {
        filteredLocations.push(location);
      }

      if (limit && filteredLocations.length >= limit) {
        break;
      }
    }

    return filteredLocations;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async countLocationsByUser(userId: string): Promise<number> {
    return await prisma.location.count({
      where: { userId },
    });
  }
}

