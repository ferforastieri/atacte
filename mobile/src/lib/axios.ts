import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.15.8:3001/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if ((status === 401 || status === 403) && data?.requiresTrust && data?.sessionId) {
        DeviceEventEmitter.emit('device-trust-required', {
          sessionId: data.sessionId,
          deviceName: data.deviceName || 'Desconhecido',
          ipAddress: data.ipAddress || 'Desconhecido',
        });
        return Promise.reject(error);
      }
      
      if (status === 401) {
        const allowedPaths = ['/auth/me', '/auth/trust-device', '/auth/logout'];
        const path = error.config?.url || '';
        const isAllowedPath = allowedPaths.some(allowed => path.includes(allowed));
        
        if (!isAllowedPath) {
          try {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user');
          } catch (storageError) {
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
