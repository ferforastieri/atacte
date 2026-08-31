import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import { randomBytes } from 'node:crypto';
import { UserRepository, CreateUserData, CreateUserSessionData } from '../../repositories/auth/userRepository';
import { PasswordResetRepository } from '../../repositories/auth/passwordResetRepository';
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
  deviceFingerprint?: string;
}

export interface RegisterRequest {
  email: string;
  masterPassword: string;
}

export interface LoginResponse {
  user: UserDto;
  token: string;
  sessionId: string;
  requiresTrust?: boolean;
}

export class AuthService {
  private userRepository: UserRepository;
  private passwordResetRepository: PasswordResetRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.passwordResetRepository = new PasswordResetRepository();
  }

  async hasUsers(): Promise<boolean> {
    return (await this.userRepository.countUsers()) > 0;
  }

  async register(data: RegisterRequest): Promise<UserDto> {
    const firstUser = !(await this.hasUsers());
    if (!firstUser) {
      throw new Error('O cadastro público já foi encerrado; peça a um administrador para criar usuários.');
    }
    const email = data.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email inválido');
    if (!data.masterPassword || data.masterPassword.length < 8 || data.masterPassword.length > 256) {
      throw new Error('A senha deve ter entre 8 e 256 caracteres');
    }
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    
    const salt = await bcrypt.genSalt(12);
    const masterPasswordHash = await bcrypt.hash(data.masterPassword, salt);

    
    const userData: CreateUserData = {
      email,
      masterPasswordHash,
      masterPasswordSalt: salt,
      role: firstUser ? 'ADMIN' : undefined,
    };

    const user = await this.userRepository.create(userData);
    return this.mapToDto(user);
  }

  async login(data: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const email = data.email?.trim().toLowerCase();
    if (!email || !data.masterPassword || data.masterPassword.length > 256) throw new Error('Credenciais inválidas');
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new Error('Conta desativada');
    }

    const isValidPassword = await bcrypt.compare(data.masterPassword, user.masterPasswordHash);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    
    await this.userRepository.updateLastLogin(user.id);

    
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

    
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + COOKIE_MAX_AGE_MS);
    const tokenHash = crypto.SHA256(token).toString();
    const deviceName = data.deviceName || 'Dispositivo Web';
    const deviceFingerprint = data.deviceFingerprint || undefined;

    let isTrusted = false;
    if (deviceFingerprint) {
      isTrusted = await this.userRepository.hasTrustedDevice(user.id, deviceFingerprint);
    }

    const sessionData: CreateUserSessionData = {
      userId: user.id,
      tokenHash: tokenHash,
      deviceName: deviceName,
      deviceFingerprint: deviceFingerprint,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      expiresAt: expiresAt,
      isTrusted: isTrusted,
    };

    const session = await this.userRepository.createSession(sessionData);

    return {
      user: this.mapToDto(user),
      token,
      sessionId: session.id,
      requiresTrust: !(session.isTrusted ?? false),
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
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (!user.isActive) {
      throw new Error('Conta desativada');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.masterPasswordHash);
    if (!isValidPassword) {
      throw new Error('Senha atual incorreta');
    }

    if (newPassword.length < 8) {
      throw new Error('A nova senha deve ter pelo menos 8 caracteres');
    }

    const salt = await bcrypt.genSalt(12);
    const masterPasswordHash = await bcrypt.hash(newPassword, salt);
    
    await this.userRepository.update(user.id, {
      masterPasswordHash,
      masterPasswordSalt: salt,
    });

    const result = await this.userRepository.findUserSessions(userId);
    for (const session of result.sessions) {
      await this.userRepository.deleteSession(session.id);
    }
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
    isTrusted: boolean;
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
        isTrusted: session.isTrusted ?? false,
      })),
      total: result.total
    };
  }

  async trustDevice(userId: string, sessionId: string): Promise<void> {
    const session = await this.userRepository.findSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error('Sessão não encontrada ou não pertence ao usuário');
    }
    await this.userRepository.updateSession(sessionId, { isTrusted: true });
    
    if (session.deviceFingerprint && session.deviceName) {
      await this.userRepository.addTrustedDevice(userId, session.deviceName, session.deviceFingerprint);
    }
    
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const result = await this.userRepository.findUserSessions(userId);
    const session = result.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    await this.userRepository.deleteSession(sessionId);
  }

  async untrustDevice(userId: string, deviceName: string): Promise<void> {
    await this.userRepository.removeTrustedDevice(userId, deviceName);
    
    const result = await this.userRepository.findUserSessions(userId);
    const sessionsToUpdate = result.sessions.filter((s) => s.deviceName === deviceName && s.isTrusted);
    
    for (const session of sessionsToUpdate) {
      await this.userRepository.updateSession(session.id, { isTrusted: false });
    }
    
  }

  async requestPasswordReset(email: string): Promise<{ token: string | undefined; expiresAt: Date }> {
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new Error('Se o email existir, você receberá um link de recuperação');
    }

    const token = randomBytes(32).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.passwordResetRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    await emailService.sendPasswordResetEmail(user.email, token, PASSWORD_RESET_URL);

    return { 
      token: undefined,
      expiresAt 
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8 || newPassword.length > 256) {
      throw new Error('A senha deve ter entre 8 e 256 caracteres');
    }
    const resetToken = await this.passwordResetRepository.findByToken(token);
    
    if (!resetToken) {
      throw new Error('Token inválido');
    }

    if (resetToken.used) {
      throw new Error('Token já foi utilizado');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error('Token expirado');
    }

    const user = resetToken.user;
    
    const salt = await bcrypt.genSalt(12);
    const masterPasswordHash = await bcrypt.hash(newPassword, salt);
    
    await this.userRepository.update(user.id, {
      masterPasswordHash,
      masterPasswordSalt: salt,
    });

    await this.passwordResetRepository.markAsUsed(token);
    const result = await this.userRepository.findUserSessions(user.id);
    for (const session of result.sessions) {
      await this.userRepository.deleteSession(session.id);
    }
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
