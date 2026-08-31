import crypto from 'crypto-js';

export class CryptoUtil {
  /** Deriva uma chave por usuário a partir do segredo do servidor, sem usar o email. */
  static deriveUserKey(masterKey: string, userId: string): string {
    return crypto.HmacSHA256(userId, masterKey).toString();
  }

  
  static encrypt(data: string, key: string): string {
    try {
      return crypto.AES.encrypt(data, key).toString();
    } catch (error) {
      throw new Error('Erro ao criptografar dados');
    }
  }

  
  static decrypt(encryptedData: string, key: string): string {
    try {
      const bytes = crypto.AES.decrypt(encryptedData, key);
      const decrypted = bytes.toString(crypto.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Falha na descriptografia');
      }
      
      return decrypted;
    } catch (error) {
      throw new Error('Erro ao descriptografar dados');
    }
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
