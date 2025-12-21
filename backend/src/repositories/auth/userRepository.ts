import { PrismaClient, User, UserSession } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  masterPasswordHash: string;
  masterPasswordSalt: string;
  encryptionKeyHash: string;
  role?: 'USER' | 'ADMIN';
}

export interface CreateUserSessionData {
  userId: string;
  tokenHash: string;
  deviceName?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date | null;
  isTrusted?: boolean;
}

export interface UpdateUserSessionData {
  lastUsed?: Date;
  deviceName?: string;
  isTrusted?: boolean;
}

export class UserRepository {
  async create(data: CreateUserData): Promise<User> {
    return await prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Partial<CreateUserData>): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  
  async createSession(data: CreateUserSessionData): Promise<UserSession> {
    return await prisma.userSession.create({
      data: {
      userId: data.userId,
      tokenHash: data.tokenHash,
      deviceName: data.deviceName,
      deviceFingerprint: data.deviceFingerprint,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      isTrusted: data.isTrusted ?? false,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findSessionByTokenHash(tokenHash: string): Promise<UserSession | null> {
    return await prisma.userSession.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async findSessionById(id: string): Promise<UserSession | null> {
    return await prisma.userSession.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async findUserSessions(userId: string, limit?: number, offset?: number): Promise<{ sessions: UserSession[]; total: number }> {
    const take = limit || undefined;
    const skip = offset || undefined;
    
    const [sessions, total] = await Promise.all([
      prisma.userSession.findMany({
        where: { userId },
        orderBy: { lastUsed: 'desc' },
        take,
        skip,
      }),
      prisma.userSession.count({
        where: { userId },
      }),
    ]);
    
    return { sessions, total };
  }

  async hasTrustedDevice(userId: string, deviceFingerprint: string): Promise<boolean> {
    if (!deviceFingerprint) {
      return false;
    }
    const trustedDevice = await prisma.trustedDevice.findUnique({
      where: {
        userId_deviceFingerprint: {
          userId,
          deviceFingerprint,
        },
      },
    });
    return !!trustedDevice;
  }

  async addTrustedDevice(userId: string, deviceName: string, deviceFingerprint: string | null | undefined): Promise<void> {
    if (!deviceFingerprint) {
      return;
    }
    await prisma.trustedDevice.upsert({
      where: {
        userId_deviceFingerprint: {
          userId,
          deviceFingerprint,
        },
      },
      update: {
        deviceName,
        lastUsed: new Date(),
      },
      create: {
        userId,
        deviceName,
        deviceFingerprint,
        lastUsed: new Date(),
      },
    });
  }

  async removeTrustedDevice(userId: string, deviceFingerprint: string): Promise<void> {
    await prisma.trustedDevice.deleteMany({
      where: {
        userId,
        deviceFingerprint,
      },
    });
  }

  async updateSession(id: string, data: UpdateUserSessionData): Promise<UserSession> {
    return await prisma.userSession.update({
      where: { id },
      data: {
        ...data,
        lastUsed: new Date(),
      },
    });
  }

  async deleteSession(id: string): Promise<void> {
    await prisma.userSession.delete({
      where: { id },
    });
  }

  async deleteExpiredSessions(): Promise<void> {
    await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
