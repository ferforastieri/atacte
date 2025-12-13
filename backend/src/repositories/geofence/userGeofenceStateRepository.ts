import { PrismaClient, UserGeofenceState } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateUserGeofenceStateData {
  userId: string;
  zoneId: string;
  isInside: boolean;
}

export interface UpdateUserGeofenceStateData {
  isInside?: boolean;
  lastEventAt?: Date;
  lastEnterAt?: Date;
  lastExitAt?: Date;
}

export class UserGeofenceStateRepository {
  async findByUserAndZone(
    userId: string,
    zoneId: string
  ): Promise<UserGeofenceState | null> {
    return prisma.userGeofenceState.findUnique({
      where: {
        userId_zoneId: {
          userId,
          zoneId,
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<UserGeofenceState[]> {
    return prisma.userGeofenceState.findMany({
      where: {
        userId,
      },
      include: {
        zone: true,
      },
    });
  }

  async create(data: CreateUserGeofenceStateData): Promise<UserGeofenceState> {
    return prisma.userGeofenceState.create({
      data: {
        userId: data.userId,
        zoneId: data.zoneId,
        isInside: data.isInside,
        lastEventAt: new Date(),
        ...(data.isInside ? { lastEnterAt: new Date() } : { lastExitAt: new Date() }),
      },
    });
  }

  async update(
    userId: string,
    zoneId: string,
    data: UpdateUserGeofenceStateData
  ): Promise<UserGeofenceState> {
    return prisma.userGeofenceState.update({
      where: {
        userId_zoneId: {
          userId,
          zoneId,
        },
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async upsert(
    userId: string,
    zoneId: string,
    data: Partial<CreateUserGeofenceStateData & UpdateUserGeofenceStateData>
  ): Promise<UserGeofenceState> {
    return prisma.userGeofenceState.upsert({
      where: {
        userId_zoneId: {
          userId,
          zoneId,
        },
      },
      create: {
        userId: data.userId ?? userId,
        zoneId: data.zoneId ?? zoneId,
        isInside: data.isInside ?? false,
        lastEventAt: data.lastEventAt ?? new Date(),
        ...(data.isInside ? { lastEnterAt: data.lastEnterAt ?? new Date() } : { lastExitAt: data.lastExitAt ?? new Date() }),
      },
      update: {
        isInside: data.isInside ?? undefined,
        lastEventAt: new Date(),
        ...(data.isInside !== undefined && data.isInside
          ? { lastEnterAt: new Date() }
          : data.isInside !== undefined && !data.isInside
          ? { lastExitAt: new Date() }
          : {}),
        updatedAt: new Date(),
      },
    });
  }

  async deleteByZone(zoneId: string): Promise<void> {
    await prisma.userGeofenceState.deleteMany({
      where: {
        zoneId,
      },
    });
  }
}

