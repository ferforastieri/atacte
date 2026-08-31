import api from './index'

export default {
  async version(): Promise<string> {
    const response = await api.get<{ data: { version: string } }>('/version')
    return response.data.data.version
  },
  async update() {
    const response = await api.post('/update')
    return response.data
  },
  async getConfig(): Promise<{ values: Record<string, string>; secretFields: string[] }> {
    const response = await api.get('/config')
    return response.data.data
  },
  async saveConfig(values: Record<string, string>) {
    const response = await api.put('/config', { values })
    return response.data
  },
}
