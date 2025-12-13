import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import { UserRepository, CreateUserData, CreateUserSessionData } from '../../repositories/auth/userRepository';
import { PasswordResetRepository } from '../../repositories/auth/passwordResetRepository';
import { JWT_SECRET, JWT_EXPIRES_IN, PASSWORD_RESET_URL } from '../../infrastructure/config';
import { emailService } from '../email/emailService';

export interface UserDto {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  isActive: boolean;
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
  private passwordResetRepository: PasswordResetRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.passwordResetRepository = new PasswordResetRepository();
  }

  async register(data: RegisterRequest): Promise<UserDto> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    
    const salt = await bcrypt.genSalt(12);
    const masterPasswordHash = await bcrypt.hash(data.masterPassword, salt);

    
    const encryptionKey = crypto.SHA256(data.masterPassword + data.email).toString();

    const userData: CreateUserData = {
      email: data.email,
      masterPasswordHash,
      masterPasswordSalt: salt,
      encryptionKeyHash: encryptionKey,
    };

    const user = await this.userRepository.create(userData);
    return this.mapToDto(user);
  }

  async login(data: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(data.email);
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
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); 

    const sessionData: CreateUserSessionData = {
      userId: user.id,
      tokenHash: crypto.SHA256(token).toString(),
      deviceName: data.deviceName || 'Dispositivo Web',
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      expiresAt,
    };

    const session = await this.userRepository.createSession(sessionData);

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

  async refreshToken(userId: string): Promise<{ token: string }> {
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
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return { token };
  }

  async getUserProfile(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return this.mapToDto(user);
  }

  async getUserSessions(userId: string): Promise<any[]> {
    const sessions = await this.userRepository.findUserSessions(userId);
    return sessions.map(session => ({
      id: session.id,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastUsed: session.lastUsed,
      expiresAt: session.expiresAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const sessions = await this.userRepository.findUserSessions(userId);
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    await this.userRepository.deleteSession(sessionId);
  }

  async requestPasswordReset(email: string): Promise<{ token: string | undefined; expiresAt: Date }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Se o email existir, você receberá um link de recuperação');
    }

    const token = crypto.SHA256(email + Date.now() + Math.random().toString()).toString();
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.passwordResetRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    await emailService.sendPasswordResetEmail(user.email, token, PASSWORD_RESET_URL);

    return { 
      token: process.env['NODE_ENV'] === 'development' ? token : undefined, 
      expiresAt 
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
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
    
    const encryptionKey = crypto.SHA256(newPassword + user.email).toString();

    await this.userRepository.update(user.id, {
      masterPasswordHash,
      masterPasswordSalt: salt,
      encryptionKeyHash: encryptionKey,
    });

    await this.passwordResetRepository.markAsUsed(token);
    const sessions = await this.userRepository.findUserSessions(user.id);
    for (const session of sessions) {
      await this.userRepository.deleteSession(session.id);
    }
  }

  private mapToDto(user: any): UserDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
    };
  }
}
