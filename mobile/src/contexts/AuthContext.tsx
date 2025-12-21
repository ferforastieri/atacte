import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth/authService';

interface User {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  role?: 'USER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, masterPassword: string, deviceName?: string, deviceFingerprint?: string) => Promise<{ success: boolean; message?: string; requiresTrust?: boolean; sessionId?: string }>;
  register: (email: string, masterPassword: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await authService.getStoredToken();
      if (!token) {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const response = await authService.getMe();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.isAuthError) {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      } else {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, masterPassword: string, deviceName?: string, deviceFingerprint?: string): Promise<{ success: boolean; message?: string; requiresTrust?: boolean; sessionId?: string }> => {
    try {
      await authService.logout();
      
      const response = await authService.login({ email, masterPassword, deviceName, deviceFingerprint });
      if (response.success && response.data) {
        if (response.data.token && response.data.user) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        }
        
        if (response.data.requiresTrust && response.data.sessionId) {
          return { 
            success: true, 
            requiresTrust: true, 
            sessionId: response.data.sessionId,
            message: 'Dispositivo não confiável. Por favor, confirme este dispositivo.'
          };
        }
        
        return { success: true };
      } else {
        await authService.logout();
        return { success: false, message: response.message || 'Erro no login' };
      }
    } catch (error: any) {
      await authService.logout();
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro no login. Verifique suas credenciais.';
      return { success: false, message: errorMessage };
    }
  };

  const register = async (email: string, masterPassword: string, name?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.register({ email, masterPassword });
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Erro no registro' };
      }
    } catch (error) {
      return { success: false, message: 'Erro no registro' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authService.getMe();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.isAuthError) {
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
