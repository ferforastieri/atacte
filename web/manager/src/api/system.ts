import api from './index'
export interface UpdateInfo { currentVersion: string; latestVersion: string | null; updateAvailable: boolean; releaseUrl: string | null }
export default {
  async version(): Promise<string> { return (await api.get('/version')).data.data.version },
  async updates(): Promise<UpdateInfo> { return (await api.get('/updates', { headers: { 'X-Silent-Toast': 'true' } })).data.data },
}
