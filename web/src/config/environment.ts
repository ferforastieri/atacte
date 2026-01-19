
const isElectron = () => {
  return !!(window as any).electronAPI || !!(window as any).SENTRO_BACKEND_URL;
}

const getElectronBackendUrl = () => {
  if ((window as any).SENTRO_BACKEND_URL) {
    return (window as any).SENTRO_BACKEND_URL;
  }
  if ((window as any).electronAPI?.getBackendUrl) {
    return (window as any).electronAPI.getBackendUrl();
  }
  return null;
}

export const config = {
  API_URL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api'),
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Sentro',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  ENABLE_DEV_TOOLS: import.meta.env.NODE_ENV === 'development',
  
  get apiUrl() {
    if (isElectron()) {
      const backendUrl = getElectronBackendUrl();
      if (backendUrl) {
        return backendUrl + '/api';
      }
    }
    return this.API_URL || '/api'
  },
  
  get isDevelopment() {
    return this.NODE_ENV === 'development'
  },
  
  get isProduction() {
    return this.NODE_ENV === 'production'
  },
  
  get isElectron() {
    return isElectron()
  }
}

export default config
