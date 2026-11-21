import { useState, useCallback } from 'react';
import { PasswordGenerator, PasswordGeneratorOptions, PasswordStrength } from '../utils/passwordGenerator';
import { lightColors } from '../theme/tokens';

export interface UsePasswordGeneratorReturn {
  
  password: string;
  strength: PasswordStrength;
  options: PasswordGeneratorOptions;
  isGenerating: boolean;
  
  
  generatePassword: () => void;
  updateOptions: (newOptions: Partial<PasswordGeneratorOptions>) => void;
  setPassword: (password: string) => void;
  generateMemorable: (wordCount?: number, separator?: string, capitalize?: boolean) => void;
  generateMultiple: (count: number) => string[];
  
  
  validateOptions: (options: Partial<PasswordGeneratorOptions>) => { isValid: boolean; errors: string[] };
  resetToDefaults: () => void;
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

export const usePasswordGenerator = (initialOptions?: Partial<PasswordGeneratorOptions>): UsePasswordGeneratorReturn => {
  const [generator] = useState(() => new PasswordGenerator(initialOptions));
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<PasswordStrength>({ score: 0, label: 'Fraca', color: lightColors.danger });
  const [options, setOptions] = useState<PasswordGeneratorOptions>(() => ({
    ...DEFAULT_OPTIONS,
    ...initialOptions,
  }));
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePassword = useCallback(() => {
    setIsGenerating(true);
    try {
      const newPassword = generator.generate();
      setPassword(newPassword);
      setStrength(generator.evaluateStrength(newPassword));
    } catch (error) {
      console.error('Erro ao gerar senha:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [generator]);

  const updateOptions = useCallback((newOptions: Partial<PasswordGeneratorOptions>) => {
    const updatedOptions = { ...options, ...newOptions };
    setOptions(updatedOptions);
    generator.updateOptions(updatedOptions);
    
    
    if (password) {
      setStrength(generator.evaluateStrength(password));
    }
  }, [generator, options, password]);

  const handleSetPassword = useCallback((newPassword: string) => {
    setPassword(newPassword);
    setStrength(generator.evaluateStrength(newPassword));
  }, [generator]);

  const generateMemorable = useCallback((wordCount: number = 4, separator: string = '-', capitalize: boolean = true) => {
    setIsGenerating(true);
    try {
      const memorablePassword = generator.generateMemorable(wordCount, separator, capitalize);
      setPassword(memorablePassword);
      setStrength(generator.evaluateStrength(memorablePassword));
    } catch (error) {
      console.error('Erro ao gerar senha memorável:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [generator]);

  const generateMultiple = useCallback((count: number): string[] => {
    try {
      return generator.generateMultiple(count);
    } catch (error) {
      console.error('Erro ao gerar múltiplas senhas:', error);
      return [];
    }
  }, [generator]);

  const validateOptions = useCallback((optionsToValidate: Partial<PasswordGeneratorOptions>) => {
    return generator.validateOptions(optionsToValidate);
  }, [generator]);

  const resetToDefaults = useCallback(() => {
    const defaultOptions = { ...DEFAULT_OPTIONS };
    setOptions(defaultOptions);
    generator.updateOptions(defaultOptions);
    setPassword('');
    setStrength({ score: 0, label: 'Fraca', color: lightColors.danger });
  }, [generator]);

  return {
    
    password,
    strength,
    options,
    isGenerating,
    
    
    generatePassword,
    updateOptions,
    setPassword: handleSetPassword,
    generateMemorable,
    generateMultiple,
    
    
    validateOptions,
    resetToDefaults,
  };
};
