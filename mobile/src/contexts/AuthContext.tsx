import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth/authService';

interface User {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; message?: string }>;
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
      if (token) {
        const cachedUser = await authService.getStoredUser();
        if (cachedUser) {
          // Mostrar imediatamente com dados do cache
          setUser(cachedUser);
          setIsAuthenticated(true);
          setIsLoading(false); // Liberar a UI imediatamente
          
          // Validar em background sem bloquear
          validateTokenInBackground(token, cachedUser);
        } else {
          // Sem cache, precisa validar antes de liberar
          try {
            const response = await authService.getMe();
            if (response.success && response.data) {
              setUser(response.data.user);
              setIsAuthenticated(true);
              if (response.data.user) {
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
              }
            } else {
              if (response.isAuthError) {
                await authService.logout();
                setUser(null);
                setIsAuthenticated(false);
              }
            }
          } catch (error: any) {
            console.error('Erro ao verificar autenticação no servidor:', error);
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
          } finally {
            setIsLoading(false);
          }
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const validateTokenInBackground = async (token: string, cachedUser: User) => {
    try {
      const response = await authService.getMe();
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        if (response.data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } else {
        // Só fazer logout se for erro de autenticação, não se for erro de rede
        if (response.isAuthError) {
          await authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
        // Se for erro de rede, manter o cache válido
      }
    } catch (error: any) {
      console.error('Erro ao validar token em background:', error);
      // Manter o cache válido em caso de erro inesperado
    }
  };

  const login = async (email: string, masterPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.login({ email, masterPassword });
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Erro no login' };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, message: 'Erro no login' };
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
      console.error('Erro no registro:', error);
      return { success: false, message: 'Erro no registro' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authService.getMe();
      if (response.success && response.data) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
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
