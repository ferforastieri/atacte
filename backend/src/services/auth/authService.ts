import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../infrastructure/prisma';
import { hashPassword, tokenHash, verifyPassword } from '../../utils/credentialUtil';
import { changePassword, invalidateCredentials, lockUser } from './securityService';
import { AuditUtil } from '../../utils/auditUtil';
import { UserRepository } from '../../repositories/auth/userRepository';
import { COOKIE_MAX_AGE_MS, JWT_AUDIENCE, JWT_EXPIRES_IN, JWT_ISSUER, JWT_SECRET, PASSWORD_RESET_URL } from '../../infrastructure/config';
import { emailService } from '../email/emailService';

export interface UserDto {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  isActive: boolean;
  role: 'USER' | 'ADMIN';
  name?: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  masterPassword: string;
  deviceName?: string;
}

export interface RegisterRequest {
  email: string;
  masterPassword: string;
}

export interface LoginResponse {
  user: UserDto;
  token: string;
  sessionId: string;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async hasUsers(): Promise<boolean> {
    return (await prisma.securityState.findUnique({ where: { id: 1 } }))?.initialized ?? true;
  }

  async register(data: RegisterRequest): Promise<UserDto> {
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email inválido');
    const hash = await hashPassword(data.masterPassword);
    const user = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM security_state WHERE id = 1 FOR UPDATE`;
      const state = await tx.securityState.findUnique({ where: { id: 1 } });
      if (!state || state.initialized || !state.bootstrapExpiresAt || state.bootstrapExpiresAt <= new Date() || state.bootstrapEmail !== email) {
        throw new Error('Cadastro encerrado ou email não autorizado');
      }
      if (await tx.user.count()) throw new Error('Cadastro encerrado');
      const created = await tx.user.create({ data: { email, ...hash, role: 'ADMIN' } });
      await tx.securityState.update({ where: { id: 1 }, data: { initialized: true, bootstrapEmail: null, bootstrapExpiresAt: null } });
      return created;
    });
    await AuditUtil.log(user.id, 'USER_REGISTERED', 'USER', user.id);
    return this.mapToDto(user);
  }

  async login(data: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (!email || email.length > 254) throw new Error('Credenciais inválidas');
    const user = await this.userRepository.findByEmail(email);
    const valid = await verifyPassword(data.masterPassword, user?.masterPasswordHash);
    if (!user || !valid || !user.isActive) {
      await AuditUtil.log(user?.id ?? null, 'LOGIN_FAILED');
      throw new Error('Credenciais inválidas');
    }
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email
      },
      JWT_SECRET as jwt.Secret,
      { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'], issuer: JWT_ISSUER, audience: JWT_AUDIENCE, jwtid: randomBytes(16).toString('hex') }
    );

    
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + COOKIE_MAX_AGE_MS);
    const tokenHash = crypto.SHA256(token).toString();
    const deviceName = data.deviceName || 'Dispositivo Web';

    const session = await prisma.$transaction(async tx => {
      await lockUser(tx, user.id);
      const current = await tx.user.findUnique({ where: { id: user.id } });
      if (!current?.isActive || current.masterPasswordHash !== user.masterPasswordHash) throw new Error('Credenciais inválidas');
      await tx.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
      return tx.userSession.create({ data: {
        userId: user.id, tokenHash: tokenHash, deviceName: typeof deviceName === 'string' ? deviceName.slice(0, 255) : 'Dispositivo',
        ipAddress: ipAddress || 'unknown', userAgent: userAgent?.slice(0, 512) || 'unknown', expiresAt,
        reauthenticatedAt: new Date(),
      } });
    });
    await AuditUtil.log(user.id, 'LOGIN_SUCCESS', 'SESSION', session.id);

    return {
      user: this.mapToDto(user),
      token,
      sessionId: session.id,
    };
  }

  async logout(userId: string, token?: string): Promise<void> {
    if (token) {
      const tokenHash = crypto.SHA256(token).toString();
      const session = await this.userRepository.findSessionByTokenHash(tokenHash);
      if (session && session.userId === userId) {
        await this.userRepository.deleteSession(session.id);
      }
    }
  }

  async refreshToken(userId: string, sessionId: string, currentToken?: string): Promise<{ token: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new Error('Usuário não encontrado ou inativo');
    }

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET não configurado');
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email
      },
      JWT_SECRET as jwt.Secret,
      { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'], issuer: JWT_ISSUER, audience: JWT_AUDIENCE, jwtid: randomBytes(16).toString('hex') }
    );

    if (!currentToken) throw new Error('Sessão inválida');
    await this.userRepository.updateSession(sessionId, { tokenHash: crypto.SHA256(token).toString() });

    return { token };
  }

  async getUserProfile(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return this.mapToDto(user);
  }

  async changeMasterPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await changePassword(userId, newPassword, currentPassword);
    await AuditUtil.log(userId, 'PASSWORD_CHANGED', 'USER', userId);
  }

  async getUserSessions(userId: string, currentTokenHash?: string, limit?: number, offset?: number): Promise<{ sessions: Array<{
    id: string;
    deviceName: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    lastUsed: Date;
    expiresAt: Date | null;
    isCurrent: boolean;
  }>; total: number }> {
    const result = await this.userRepository.findUserSessions(userId, limit, offset);
    return {
      sessions: result.sessions.map(session => ({
        id: session.id,
        deviceName: session.deviceName,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        lastUsed: session.lastUsed,
        expiresAt: session.expiresAt,
        isCurrent: currentTokenHash ? session.tokenHash === currentTokenHash : false,
      })),
      total: result.total
    };
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const result = await this.userRepository.findUserSessions(userId);
    const session = result.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    await this.userRepository.deleteSession(sessionId);
  }

  async requestPasswordReset(email: string): Promise<void> {
    if (typeof email !== 'string' || email.length > 254) return;
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase());
    if (!user?.isActive) return;
    const token = randomBytes(32).toString('hex');
    await prisma.$transaction(async tx => {
      await lockUser(tx, user.id);
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.create({ data: { userId: user.id, token: tokenHash(token), expiresAt: new Date(Date.now() + 3600000) } });
    });
    try {
      await emailService.sendPasswordResetEmail(user.email, token, PASSWORD_RESET_URL);
      await AuditUtil.log(user.id, 'PASSWORD_RESET_REQUESTED');
    } catch {
      await AuditUtil.log(user.id, 'PASSWORD_RESET_DELIVERY_FAILED');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new Error('Token inválido ou expirado');
    const hash = await hashPassword(newPassword);
    const digest = tokenHash(token);
    await prisma.$transaction(async tx => {
      const reset = await tx.passwordResetToken.findUnique({ where: { token: digest } });
      if (!reset) throw new Error('Token inválido ou expirado');
      await lockUser(tx, reset.userId);
      const consumed = await tx.passwordResetToken.updateMany({ where: { token: digest, used: false, expiresAt: { gt: new Date() } }, data: { used: true } });
      if (consumed.count !== 1) throw new Error('Token inválido ou expirado');
      await tx.user.update({ where: { id: reset.userId }, data: hash });
      await invalidateCredentials(tx, reset.userId);
      await tx.auditLog.create({ data: { userId: reset.userId, action: 'PASSWORD_RESET_COMPLETED' } });
    });
  }

  private mapToDto(user: { id: string; email: string; createdAt: Date; updatedAt: Date; lastLogin: Date | null; isActive: boolean; role: 'USER' | 'ADMIN'; name?: string | null; phoneNumber?: string | null }): UserDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
      role: user.role || 'USER',
      name: user.name || undefined,
      phoneNumber: user.phoneNumber || undefined,
    };
  }
}
