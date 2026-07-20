import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export const SERVER_URL_STORAGE_KEY = 'server_url';

interface ServerContextType {
  serverUrl: string | null;
  isLoading: boolean;
  connectToServer: (url: string) => Promise<void>;
  clearServer: () => Promise<void>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function normalizeServerUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  const parsed = new URL(trimmed);

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Use uma URL iniciada por http:// ou https://');
  }

  const path = parsed.pathname.replace(/\/+$/, '');
  parsed.pathname = path.endsWith('/api') ? path : `${path}/api`;
  parsed.search = '';
  parsed.hash = '';

  return parsed.toString().replace(/\/$/, '');
}

export function ServerProvider({ children }: { children: ReactNode }) {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SERVER_URL_STORAGE_KEY)
      .then(setServerUrl)
      .finally(() => setIsLoading(false));
  }, []);

  const connectToServer = async (url: string) => {
    const normalizedUrl = normalizeServerUrl(url);
    await AsyncStorage.setItem(SERVER_URL_STORAGE_KEY, normalizedUrl);
    setServerUrl(normalizedUrl);
  };

  const clearServer = async () => {
    await AsyncStorage.removeItem(SERVER_URL_STORAGE_KEY);
    setServerUrl(null);
  };

  return (
    <ServerContext.Provider value={{ serverUrl, isLoading, connectToServer, clearServer }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServer(): ServerContextType {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer deve ser usado dentro de um ServerProvider');
  }
  return context;
}
