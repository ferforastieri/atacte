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
    const where: any = { userId };

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
    const result = await prisma.$queryRaw<FamilyMemberLocation[]>`
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

    return result;
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
    return await prisma.location.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
      take: limit || 1000,
    });
  }

  async countLocationsByUser(userId: string): Promise<number> {
    return await prisma.location.count({
      where: { userId },
    });
  }
}

