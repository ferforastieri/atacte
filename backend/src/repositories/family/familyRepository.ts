import { PrismaClient, Family, FamilyMember } from '../../../node_modules/.prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface CreateFamilyData {
  name: string;
  description?: string;
  createdById: string;
}

export interface UpdateFamilyData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AddMemberData {
  familyId: string;
  userId: string;
  role?: string;
  nickname?: string;
}

export interface UpdateMemberData {
  role?: string;
  nickname?: string;
  isActive?: boolean;
}

export interface FamilyWithMembers extends Family {
  members: Array<FamilyMember & {
    user: {
      id: string;
      name: string | null;
      email: string;
      profilePicture: string | null;
    };
  }>;
}

export class FamilyRepository {
  private generateInviteCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  async create(data: CreateFamilyData): Promise<Family> {
    return await prisma.family.create({
      data: {
        ...data,
        inviteCode: this.generateInviteCode(),
      },
    });
  }

  async findById(id: string): Promise<FamilyWithMembers | null> {
    return await prisma.family.findUnique({
      where: { id },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });
  }

  async findByInviteCode(inviteCode: string): Promise<Family | null> {
    return await prisma.family.findUnique({
      where: { inviteCode },
    });
  }

  async findByUserId(userId: string): Promise<FamilyWithMembers[]> {
    const memberships = await prisma.familyMember.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        family: {
          include: {
            members: {
              where: { isActive: true },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePicture: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => m.family);
  }

  async update(id: string, data: UpdateFamilyData): Promise<Family> {
    return await prisma.family.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.family.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addMember(data: AddMemberData): Promise<FamilyMember> {
    const existingMember = await prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: data.familyId,
          userId: data.userId,
        },
      },
    });

    if (existingMember) {
      return await prisma.familyMember.update({
        where: { id: existingMember.id },
        data: {
          isActive: true,
          role: data.role || 'member',
          nickname: data.nickname,
          joinedAt: new Date(),
        },
      });
    }

    return await prisma.familyMember.create({
      data: {
        familyId: data.familyId,
        userId: data.userId,
        role: data.role || 'member',
        nickname: data.nickname,
      },
    });
  }

  async findMemberById(id: string): Promise<FamilyMember | null> {
    return await prisma.familyMember.findUnique({
      where: { id },
    });
  }

  async findMemberByFamilyAndUser(
    familyId: string,
    userId: string
  ): Promise<FamilyMember | null> {
    return await prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId,
        },
      },
    });
  }

  async updateMember(id: string, data: UpdateMemberData): Promise<FamilyMember> {
    return await prisma.familyMember.update({
      where: { id },
      data,
    });
  }

  async removeMember(id: string): Promise<void> {
    await prisma.familyMember.update({
      where: { id },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });
  }

  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    return await prisma.familyMember.findMany({
      where: {
        familyId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async isUserMemberOfFamily(userId: string, familyId: string): Promise<boolean> {
    const member = await prisma.familyMember.findFirst({
      where: {
        userId,
        familyId,
        isActive: true,
      },
    });

    return !!member;
  }

  async isUserAdminOfFamily(userId: string, familyId: string): Promise<boolean> {
    const member = await prisma.familyMember.findFirst({
      where: {
        userId,
        familyId,
        role: 'admin',
        isActive: true,
      },
    });

    return !!member;
  }
}

