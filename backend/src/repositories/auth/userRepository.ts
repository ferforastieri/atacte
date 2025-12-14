import { PrismaClient, User, UserSession } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  masterPasswordHash: string;
  masterPasswordSalt: string;
  encryptionKeyHash: string;
}

export interface CreateUserSessionData {
  userId: string;
  tokenHash: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date | null;
}

export interface UpdateUserSessionData {
  lastUsed?: Date;
  deviceName?: string;
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
      data,
    });
  }

  async findSessionByTokenHash(tokenHash: string): Promise<UserSession | null> {
    return await prisma.userSession.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async findUserSessions(userId: string): Promise<UserSession[]> {
    return await prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastUsed: 'desc' },
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
