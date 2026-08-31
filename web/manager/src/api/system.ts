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
}
