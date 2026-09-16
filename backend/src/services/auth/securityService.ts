import { prisma } from '../../infrastructure/prisma';
import { Prisma } from '@prisma/client';
import { hashPassword, verifyPassword } from '../../utils/credentialUtil';

export async function lockUser(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
}

export async function invalidateCredentials(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.userSession.deleteMany({ where: { userId } });
  await tx.passwordResetToken.deleteMany({ where: { userId } });
}

export async function changePassword(userId: string, password: unknown, currentPassword?: unknown): Promise<void> {
  const hash = await hashPassword(password);
  await prisma.$transaction(async tx => {
    await lockUser(tx, userId);
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || (currentPassword !== undefined && !(await verifyPassword(currentPassword, user.masterPasswordHash)))) {
      throw new Error('Credenciais inválidas');
    }
    await tx.user.update({ where: { id: userId }, data: hash });
    await invalidateCredentials(tx, userId);
  }, { timeout: 15000 });
}

export async function allowRegistration(email: string): Promise<void> {
  email = email.trim().toLowerCase();
  if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email inválido');
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM security_state WHERE id = 1 FOR UPDATE`;
    const state = await tx.securityState.findUnique({ where: { id: 1 } });
    if (!state || state.initialized || await tx.user.count()) throw new Error('Instalação já inicializada');
    await tx.securityState.update({ where: { id: 1 }, data: { bootstrapEmail: email, bootstrapExpiresAt: new Date(Date.now() + 15 * 60000) } });
  });
}
