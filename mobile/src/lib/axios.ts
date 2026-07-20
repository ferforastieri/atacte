import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { SERVER_URL_STORAGE_KEY } from '../contexts/ServerContext';

const apiClient: AxiosInstance = axios.create({
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const serverUrl = await AsyncStorage.getItem(SERVER_URL_STORAGE_KEY);
      if (!serverUrl) {
        throw new Error('Nenhum servidor foi configurado.');
      }
      config.baseURL = serverUrl;

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
    const message = response.data?.message;
    if (response.config.method?.toLowerCase() !== 'get' && typeof message === 'string') {
      DeviceEventEmitter.emit('api-response-toast', { type: 'success', message });
    }
    return response;
  },
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (typeof data?.message === 'string') {
        DeviceEventEmitter.emit('api-response-toast', { type: 'error', message: data.message });
      }
      
      if ((status === 401 || status === 403) && data?.requiresTrust && data?.sessionId) {
        DeviceEventEmitter.emit('device-trust-required', {
          sessionId: data.sessionId,
          deviceName: data.deviceName || 'Desconhecido',
          ipAddress: data.ipAddress || 'Desconhecido',
        });
        return Promise.reject(error);
      }
      
      if (status === 401) {
        const path = error.config?.url || '';
        const isLogout = path.includes('/auth/logout');
        
        if (!isLogout) {
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
