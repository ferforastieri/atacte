const dev = import.meta.env.DEV
const mode = import.meta.env.MODE

function getApiUrl(): string {
  const win = window as Window & { ATACTE_BACKEND_URL?: string; electronAPI?: { getBackendUrl?: () => string } }
  if (win.ATACTE_BACKEND_URL) return win.ATACTE_BACKEND_URL + '/api'
  if (win.electronAPI?.getBackendUrl?.()) return win.electronAPI.getBackendUrl!() + '/api'

  const fromEnv = import.meta.env.VITE_API_URL
  if (fromEnv) return fromEnv
  if (dev) return 'http://localhost:3001/api'
  return '/api'
}

export const env = {
  apiUrl: getApiUrl(),
  appName: import.meta.env.VITE_APP_NAME ?? 'Atacte',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
  isDev: dev,
  isProd: mode === 'production',
}

export default env
