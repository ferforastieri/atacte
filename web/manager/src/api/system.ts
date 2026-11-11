import api from './index'
export type UpdateRunStatus = 'running' | 'success' | 'error'
export interface UpdateRunState { status: UpdateRunStatus; version: string | null; updatedAt: string | null }
export interface UpdateInfo {
  currentVersion: string
  latestVersion: string | null
  updateAvailable: boolean
  releaseUrl: string | null
  supported: boolean
  autoUpdate: boolean
  busy: boolean
  state: UpdateRunState | null
}
export interface UpdateApplyResult { status: 'started' | 'current'; version?: string }
export default {
  async version(): Promise<string> { return (await api.get('/version')).data.data.version },
  async updates(): Promise<UpdateInfo> { return (await api.get('/updates', { headers: { 'X-Silent-Toast': 'true' } })).data.data },
  async applyUpdate(): Promise<UpdateApplyResult> {
    return (await api.post('/updates/apply', {}, { headers: { 'X-Silent-Toast': 'true' } })).data.data
  },
}
