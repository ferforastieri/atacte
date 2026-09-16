import { PasswordResetToken } from '@prisma/client';

import { prisma } from '../../infrastructure/prisma';

export interface CreatePasswordResetTokenData {
  userId: string;
  token: string;
  expiresAt: Date;
}

export class PasswordResetRepository {
  async create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken> {
    await prisma.passwordResetToken.updateMany({
      where: { userId: data.userId, used: false },
      data: { used: true },
    });

    return prisma.passwordResetToken.create({
      data,
    });
  }

  async findByToken(token: string): Promise<(PasswordResetToken & { user: { id: string; email: string } }) | null> {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    }) as Promise<(PasswordResetToken & { user: { id: string; email: string } }) | null>;
  }

  async markAsUsed(token: string): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });
  }

  async deleteExpiredTokens(): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

