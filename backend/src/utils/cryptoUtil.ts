import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import crypto from 'crypto-js';

const CIPHERTEXT_PREFIX = 'gcm-v1';

function deriveKey(key: string): Buffer {
  if (!key) throw new Error('Chave de criptografia ausente');
  return createHash('sha256').update(key, 'utf8').digest();
}

export class CryptoUtil {
  
  static encrypt(data: string, key: string): string {
    try {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', deriveKey(key), iv);
      const ciphertext = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      return [CIPHERTEXT_PREFIX, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':');
    } catch (error) {
      throw new Error('Erro ao criptografar dados');
    }
  }

  
  static decrypt(encryptedData: string, key: string): string {
    try {
      const [prefix, encodedIv, encodedTag, encodedCiphertext] = encryptedData.split(':');
      if (prefix !== CIPHERTEXT_PREFIX || !encodedIv || !encodedTag || !encodedCiphertext) {
        throw new Error('Formato de ciphertext inválido');
      }
      const decipher = createDecipheriv('aes-256-gcm', deriveKey(key), Buffer.from(encodedIv, 'base64'));
      decipher.setAuthTag(Buffer.from(encodedTag, 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(encodedCiphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch (error) {
      throw new Error('Erro ao descriptografar dados');
    }
  }

  /**
   * Decrypts the legacy CryptoJS/OpenSSL ciphertext used before the database
   * consolidation. This method is intentionally only used by the one-time
   * migration script; all new application writes use authenticated AES-GCM.
   */
  static decryptLegacy(encryptedData: string, key: string): string {
    try {
      const bytes = crypto.AES.decrypt(encryptedData, key);
      const decrypted = bytes.toString(crypto.enc.Utf8);
      if (!decrypted) throw new Error('Falha na descriptografia');
      return decrypted;
    } catch (error) {
      throw new Error('Erro ao descriptografar ciphertext legado');
    }
  }

  static isAuthenticatedCiphertext(value: string): boolean {
    return value.startsWith(`${CIPHERTEXT_PREFIX}:`);
  }

  
  static generateKey(bits: number = 256): string {
    return crypto.lib.WordArray.random(bits / 8).toString();
  }

  
  static generateSalt(bits: number = 128): string {
    return crypto.lib.WordArray.random(bits / 8).toString();
  }

  
  static hash(data: string): string {
    return crypto.SHA256(data).toString();
  }

  
  static isValidHash(hash: string): boolean {
    return /^[a-f0-9]{64}$/i.test(hash);
  }
}
