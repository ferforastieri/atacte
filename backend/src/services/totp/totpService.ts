import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { CryptoUtil } from '../../utils/cryptoUtil';
import { PasswordRepository } from '../../repositories/passwords/passwordRepository';
import { AuditUtil } from '../../utils/auditUtil';
import { Request } from 'express';

export interface TOTPData {
  secret: string;
  qrCodeUrl?: string;
  manualEntryKey: string;
}

export interface TOTPCode {
  code: string;
  timeRemaining: number; 
  period: number; 
}

export interface TOTPValidation {
  isValid: boolean;
  delta?: number; 
}

export class TOTPService {
  private passwordRepository: PasswordRepository;
  private static readonly TOTP_WINDOW = 2; 
  private static readonly TOTP_PERIOD = 30; 

  constructor() {
    this.passwordRepository = new PasswordRepository();
  }

  
  static generateSecret(serviceName: string, accountName: string): TOTPData {
    const secret = speakeasy.generateSecret({
      name: `${serviceName} (${accountName})`,
      issuer: 'Atacte Password Manager',
      length: 32
    });

    return {
      secret: secret.base32!,
      qrCodeUrl: secret.otpauth_url,
      manualEntryKey: secret.base32!
    };
  }

  
  static generateCurrentCode(secret: string): TOTPCode {
    
    
    const cleanSecret = secret.trim().replace(/\s/g, '').toUpperCase();
    
    if (!cleanSecret) {
      throw new Error('Secret TOTP vazio');
    }

    
    const token = speakeasy.totp({
      secret: cleanSecret,
      encoding: 'base32',
      step: this.TOTP_PERIOD
    });


    const timeRemaining = this.TOTP_PERIOD - (Math.floor(Date.now() / 1000) % this.TOTP_PERIOD);

    return {
      code: token,
      timeRemaining,
      period: this.TOTP_PERIOD
    };
  }

  
  static validateCode(secret: string, code: string): TOTPValidation {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: this.TOTP_WINDOW,
      step: this.TOTP_PERIOD
    });

    return {
      isValid: verified,
      delta: verified ? 0 : undefined
    };
  }

  
  static generateMultipleCodes(secret: string): {
    previous: number;
    current: number;
    next: number;
    timeRemaining: number;
  } {
    const now = Math.floor(Date.now() / 1000);
    const step = Math.floor(now / this.TOTP_PERIOD);

    const previous = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: (step - 1) * this.TOTP_PERIOD,
      step: this.TOTP_PERIOD
    });

    const current = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: step * this.TOTP_PERIOD,
      step: this.TOTP_PERIOD
    });

    const next = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: (step + 1) * this.TOTP_PERIOD,
      step: this.TOTP_PERIOD
    });

    const timeRemaining = this.TOTP_PERIOD - (now % this.TOTP_PERIOD);

    return {
      previous: parseInt(previous),
      current: parseInt(current),
      next: parseInt(next),
      timeRemaining
    };
  }

  
  static formatCode(code: number): string {
    return code.toString().padStart(6, '0');
  }

  
  static isValidSecret(secret: string): boolean {
    try {
      
      speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        step: this.TOTP_PERIOD
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await qrcode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error('Erro ao gerar QR Code');
    }
  }

  
  static parseOtpAuthUrl(otpauthUrl: string): {
    secret: string;
    serviceName: string;
    accountName: string;
  } | null {
    try {
      
      
      const cleanUrl = otpauthUrl.trim();
      
      
      if (!cleanUrl.startsWith('otpauth://totp/')) {
        return null;
      }
      
      
      const urlPart = cleanUrl.substring(15); 
      
      
      const parts = urlPart.split('?');
      const pathname = parts[0];
      const queryString = parts[1];
      
      if (!queryString || !pathname) {
        return null;
      }
      
      
      const params = new URLSearchParams(queryString);
      const secret = params.get('secret');
      
      if (!secret) {
        return null;
      }
      
      
      const pathParts = pathname.split(':');
      const serviceName = decodeURIComponent(pathParts[0] || '');
      const accountName = pathParts.length > 1 ? decodeURIComponent(pathParts[1] || '') : '';

      const result = {
        secret: secret.trim(),
        serviceName,
        accountName
      };
      
      return result;
    } catch (error) {
      return null;
    }
  }

  
  static encryptSecret(secret: string, encryptionKey: string): string {
    return CryptoUtil.encrypt(secret, encryptionKey);
  }

  
  static decryptSecret(encryptedSecret: string, encryptionKey: string): string {
    return CryptoUtil.decrypt(encryptedSecret, encryptionKey);
  }

  

  
  async addTotpToEntry(
    userId: string, 
    passwordId: string, 
    totpInput: string, 
    req?: Request
  ): Promise<any> {
    
    const existingEntry = await this.passwordRepository.findById(passwordId, userId);

    if (!existingEntry) {
      throw new Error('Senha não encontrada');
    }

    
    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    let totpSecret: string;

    
    if (totpInput.startsWith('otpauth://')) {
      const parsed = TOTPService.parseOtpAuthUrl(totpInput);
      
      if (!parsed) {
        throw new Error('URL otpauth inválida');
      }
      
      totpSecret = parsed.secret;
    } else {
      
      totpSecret = totpInput;
    }

    
    if (!TOTPService.isValidSecret(totpSecret)) {
      throw new Error('Secret TOTP inválido');
    }

    
    const encryptedSecret = TOTPService.encryptSecret(totpSecret, user.encryptionKeyHash);

    const updatedEntry = await this.passwordRepository.update(passwordId, {
      totpSecret: encryptedSecret,
      totpEnabled: true
    });

    await AuditUtil.log(
      userId,
      'PASSWORD_UPDATED',
      'PASSWORD_ENTRY',
      passwordId,
      { action: 'TOTP_ADDED' },
      req
    );

    return updatedEntry;
  }

  
  async removeTotpFromEntry(
    userId: string, 
    passwordId: string, 
    req?: Request
  ): Promise<any> {
    const existingEntry = await this.passwordRepository.findById(passwordId, userId);

    if (!existingEntry) {
      throw new Error('Senha não encontrada');
    }

    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const updatedEntry = await this.passwordRepository.update(passwordId, {
      totpSecret: undefined,
      totpEnabled: false
    } as any);

    await AuditUtil.log(
      userId,
      'PASSWORD_UPDATED',
      'PASSWORD_ENTRY',
      passwordId,
      { action: 'TOTP_REMOVED' },
      req
    );

    return updatedEntry;
  }

  
  async getTotpCodeForEntry(
    userId: string, 
    passwordId: string, 
    req?: Request
  ): Promise<TOTPCode | null> {
    const entry = await this.passwordRepository.findById(passwordId, userId);
    
    if (!entry || !entry.totpEnabled || !entry.totpSecret) {
      return null;
    }

    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    try {
      const decryptedSecret = TOTPService.decryptSecret(entry.totpSecret, user.encryptionKeyHash);
      
      const totpCode = TOTPService.generateCurrentCode(decryptedSecret);

      
      await AuditUtil.log(
        userId,
        'PASSWORD_VIEWED',
        'PASSWORD_ENTRY',
        passwordId,
        { action: 'TOTP_CODE_ACCESSED' },
        req
      );

      return totpCode;
    } catch (error) {
      return null;
    }
  }

  
  async getTotpSecretForEntry(
    userId: string, 
    passwordId: string, 
    req?: Request
  ): Promise<{ secret: string } | null> {
    const entry = await this.passwordRepository.findById(passwordId, userId);
    
    if (!entry || !entry.totpEnabled || !entry.totpSecret) {
      return null;
    }

    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    try {
      const decryptedSecret = TOTPService.decryptSecret(entry.totpSecret, user.encryptionKeyHash);
      
      
      await AuditUtil.log(
        userId,
        'PASSWORD_VIEWED',
        'PASSWORD_ENTRY',
        passwordId,
        { action: 'TOTP_SECRET_ACCESSED' },
        req
      );

      return { secret: decryptedSecret };
    } catch (error) {
      return null;
    }
  }

}
