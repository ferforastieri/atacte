export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  customSymbols?: string;
}

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const DEFAULT_OPTIONS: PasswordGeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
};

const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: 'il1Lo0O',
  ambiguous: '{}[]()/\\\'"`~,;.<>',
};

export class PasswordGenerator {
  private options: PasswordGeneratorOptions;

  constructor(options: Partial<PasswordGeneratorOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  
  generate(): string {
    const { length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, excludeAmbiguous, customSymbols } = this.options;

    if (length < 1) {
      throw new Error('O comprimento da senha deve ser pelo menos 1');
    }

    
    let availableChars = '';

    if (includeUppercase) {
      availableChars += CHARACTER_SETS.uppercase;
    }
    if (includeLowercase) {
      availableChars += CHARACTER_SETS.lowercase;
    }
    if (includeNumbers) {
      availableChars += CHARACTER_SETS.numbers;
    }
    if (includeSymbols) {
      availableChars += customSymbols || CHARACTER_SETS.symbols;
    }

    if (availableChars.length === 0) {
      throw new Error('Pelo menos um tipo de caractere deve ser selecionado');
    }

    
    if (excludeSimilar) {
      availableChars = availableChars.split('').filter(char => !CHARACTER_SETS.similar.includes(char)).join('');
    }

    
    if (excludeAmbiguous) {
      availableChars = availableChars.split('').filter(char => !CHARACTER_SETS.ambiguous.includes(char)).join('');
    }

    
    const requiredChars: string[] = [];
    
    if (includeUppercase) {
      const uppercaseChars = excludeSimilar 
        ? CHARACTER_SETS.uppercase.split('').filter(char => !CHARACTER_SETS.similar.includes(char)).join('')
        : CHARACTER_SETS.uppercase;
      requiredChars.push(this.getRandomChar(uppercaseChars));
    }
    
    if (includeLowercase) {
      const lowercaseChars = excludeSimilar 
        ? CHARACTER_SETS.lowercase.split('').filter(char => !CHARACTER_SETS.similar.includes(char)).join('')
        : CHARACTER_SETS.lowercase;
      requiredChars.push(this.getRandomChar(lowercaseChars));
    }
    
    if (includeNumbers) {
      const numberChars = excludeSimilar 
        ? CHARACTER_SETS.numbers.split('').filter(char => !CHARACTER_SETS.similar.includes(char)).join('')
        : CHARACTER_SETS.numbers;
      requiredChars.push(this.getRandomChar(numberChars));
    }
    
    if (includeSymbols) {
      const symbolChars = customSymbols || CHARACTER_SETS.symbols;
      const filteredSymbols = excludeAmbiguous 
        ? symbolChars.split('').filter(char => !CHARACTER_SETS.ambiguous.includes(char)).join('')
        : symbolChars;
      requiredChars.push(this.getRandomChar(filteredSymbols));
    }

    
    const remainingLength = Math.max(0, length - requiredChars.length);
    const password = [...requiredChars];

    for (let i = 0; i < remainingLength; i++) {
      password.push(this.getRandomChar(availableChars));
    }

    
    return this.shuffleArray(password).join('');
  }

  
  generateMultiple(count: number): string[] {
    const passwords: string[] = [];
    for (let i = 0; i < count; i++) {
      passwords.push(this.generate());
    }
    return passwords;
  }

  
  evaluateStrength(password: string): PasswordStrength {
    let score = 0;
    let feedback: string[] = [];

    
    if (password.length >= 12) {
      score += 2;
    } else if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Use pelo menos 8 caracteres');
    }

    
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Evite caracteres repetidos');
    }

    if (/123|abc|qwe/i.test(password)) {
      score -= 1;
      feedback.push('Evite sequências comuns');
    }

    
    let label: string;
    let color: string;

    if (score >= 6) {
      label = 'Muito Forte';
      color = '#16a34a';
    } else if (score >= 4) {
      label = 'Forte';
      color = '#22c55e';
    } else if (score >= 2) {
      label = 'Média';
      color = '#eab308';
    } else {
      label = 'Fraca';
      color = '#ef4444';
    }

    return {
      score: Math.max(0, Math.min(6, score)),
      label,
      color,
    };
  }

  
  generateMemorable(wordCount: number = 4, separator: string = '-', capitalize: boolean = true): string {
    const words = [
      'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'house',
      'island', 'jungle', 'knight', 'lizard', 'mountain', 'ocean', 'palace', 'queen',
      'river', 'sunset', 'tiger', 'umbrella', 'village', 'water', 'yellow', 'zebra',
      'adventure', 'beautiful', 'creative', 'dancing', 'electric', 'fantastic', 'guitar',
      'harmony', 'incredible', 'journey', 'knowledge', 'laughter', 'magical', 'nature',
      'optimistic', 'peaceful', 'quality', 'rainbow', 'sunshine', 'treasure', 'unique',
      'victory', 'wonderful', 'xylophone', 'yesterday', 'zealous'
    ];

    const selectedWords = [];
    for (let i = 0; i < wordCount; i++) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      selectedWords.push(capitalize ? this.capitalizeFirst(randomWord) : randomWord);
    }

    return selectedWords.join(separator);
  }

  
  updateOptions(newOptions: Partial<PasswordGeneratorOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  
  getOptions(): PasswordGeneratorOptions {
    return { ...this.options };
  }

  
  validateOptions(options: Partial<PasswordGeneratorOptions>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.length !== undefined && (options.length < 1 || options.length > 128)) {
      errors.push('O comprimento deve estar entre 1 e 128 caracteres');
    }

    if (options.length !== undefined && options.length < 4) {
      errors.push('Recomendamos pelo menos 4 caracteres para uma senha segura');
    }

    const hasAnyType = 
      options.includeUppercase !== false || 
      options.includeLowercase !== false || 
      options.includeNumbers !== false || 
      options.includeSymbols !== false;

    if (!hasAnyType) {
      errors.push('Pelo menos um tipo de caractere deve ser selecionado');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  
  private getRandomChar(chars: string): string {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}


export const passwordGenerator = new PasswordGenerator();


export const generatePassword = (options?: Partial<PasswordGeneratorOptions>): string => {
  if (options) {
    const generator = new PasswordGenerator(options);
    return generator.generate();
  }
  return passwordGenerator.generate();
};

export const generateMemorablePassword = (wordCount: number = 4, separator: string = '-', capitalize: boolean = true): string => {
  return passwordGenerator.generateMemorable(wordCount, separator, capitalize);
};

export const evaluatePasswordStrength = (password: string): PasswordStrength => {
  return passwordGenerator.evaluateStrength(password);
};
