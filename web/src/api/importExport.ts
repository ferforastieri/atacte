import api from './index'


const importExportApi = {
  
  
  async importPasswords(jsonData: {
    encrypted?: boolean;
    folders?: Array<unknown>;
    items?: Array<unknown>;
  }) {
    const response = await api.post('/import-export/import', jsonData)
    return response.data
  },

  
  
  async exportToBitwarden() {
    const response = await api.get('/import-export/export/bitwarden', {
      responseType: 'blob'
    })
    
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    
    
    const contentDisposition = response.headers['content-disposition']
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `sentro-passwords-${new Date().toISOString().split('T')[0]}.json`
    
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return { success: true, filename }
  },

  
  async exportToCSV() {
    const response = await api.get('/import-export/export/csv', {
      responseType: 'blob'
    })
    
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    
    
    const contentDisposition = response.headers['content-disposition']
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `sentro-passwords-${new Date().toISOString().split('T')[0]}.csv`
    
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return { success: true, filename }
  }
}

export default importExportApi
