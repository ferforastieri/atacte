import zxcvbn from 'zxcvbn';
import { randomInt } from 'node:crypto';

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface PasswordStrength {
  score: number; 
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTime: string;
}

export class PasswordUtil {
  
  static generateSecurePassword(options: PasswordGeneratorOptions): {
    password: string;
    strength: PasswordStrength;
  } {
    const {
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols
    } = options;

    
    let charset = '';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      throw new Error('Pelo menos um tipo de caractere deve ser selecionado');
    }

    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(randomInt(charset.length));
    }
    
    
    const strength = this.evaluatePasswordStrength(password);

    return { password, strength };
  }

  
  static evaluatePasswordStrength(password: string): PasswordStrength {
    const result = zxcvbn(password);
    
    return {
      score: result.score,
      feedback: {
        warning: result.feedback.warning || '',
        suggestions: result.feedback.suggestions || []
      },
      crackTime: this.formatCrackTime(result.crack_times_display.offline_slow_hashing_1e4_per_second.toString())
    };
  }

  
  private static formatCrackTime(crackTime: string): string {
    const timeMap: { [key: string]: string } = {
      'instant': 'instantâneo',
      'less than a second': 'menos de um segundo',
      'seconds': 'segundos',
      'minutes': 'minutos',
      'hours': 'horas',
      'days': 'dias',
      'months': 'meses',
      'years': 'anos',
      'centuries': 'séculos'
    };

    let formatted = crackTime;
    Object.entries(timeMap).forEach(([en, pt]) => {
      formatted = formatted.replace(new RegExp(en, 'gi'), pt);
    });

    return formatted;
  }

  
  static validatePasswordStrength(password: string, minScore: number = 3): {
    isValid: boolean;
    strength: PasswordStrength;
  } {
    const strength = this.evaluatePasswordStrength(password);
    return {
      isValid: strength.score >= minScore,
      strength
    };
  }

  
  static findDuplicatePasswords(passwords: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    passwords.forEach(password => {
      if (seen.has(password)) {
        duplicates.add(password);
      } else {
        seen.add(password);
      }
    });

    return Array.from(duplicates);
  }

  
  static containsPersonalInfo(password: string, personalInfo: string[]): boolean {
    const lowerPassword = password.toLowerCase();
    return personalInfo.some(info => 
      info.length > 2 && lowerPassword.includes(info.toLowerCase())
    );
  }
}
