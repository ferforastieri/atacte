import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, type ThemeColors } from '../theme/tokens';

const THEME_STORAGE_KEY = '@atacte_theme';

interface ThemeContextType {
  isDark: boolean;
  isLoading: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      } else {
        setIsDark(systemColorScheme === 'dark');
      }
    } catch {
      setIsDark(systemColorScheme === 'dark');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
    } catch {
      // Keep the in-memory theme even if persistence fails.
    }
  };

  const colors = useMemo(() => getColors(isDark), [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, isLoading, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
