import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { SERVER_URL_STORAGE_KEY } from '../contexts/ServerContext';
import CookieManager from '@preeternal/react-native-cookie-manager';

const apiClient: AxiosInstance = axios.create({
  timeout: 20000,
  withCredentials: true,
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

      const cookieHeader = await CookieManager.getCookieHeader(serverUrl);
      if (cookieHeader) config.headers.Cookie = cookieHeader;
      const method = config.method?.toUpperCase() ?? 'GET';
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !config.url?.endsWith('/auth/csrf')) {
        const csrfCookies = await CookieManager.get(serverUrl);
        const csrf = csrfCookies.atacte_csrf?.value;
        if (!csrf) {
          await apiClient.get('/auth/csrf');
          const refreshed = await CookieManager.get(serverUrl);
          if (refreshed.atacte_csrf?.value) config.headers['X-CSRF-Token'] = refreshed.atacte_csrf.value;
        } else {
          config.headers['X-CSRF-Token'] = csrf;
        }
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
    const serverUrl = response.config.baseURL;
    const setCookie = response.headers['set-cookie'];
    if (serverUrl && setCookie) {
      const values = Array.isArray(setCookie) ? setCookie : [setCookie];
      Promise.all(values.map((value) => CookieManager.setFromResponse(serverUrl, value))).catch(() => undefined);
    }
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
