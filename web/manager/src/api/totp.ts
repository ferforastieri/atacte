import api from './index'


export interface TOTPData {
  secret: string
  qrCodeUrl?: string
  manualEntryKey: string
}

export interface TOTPCode {
  code: string
  timeRemaining: number
  period: number
}

export interface TOTPValidation {
  isValid: boolean
  delta?: number
}

export interface ParsedOtpAuth {
  service: string
  account: string
  secret: string
  issuer?: string
}


const totpApi = {
  
  async generateSecret(serviceName: string, accountName: string) {
    const response = await api.post('/totp/generate', {
      serviceName,
      accountName
    })
    return response.data
  },

  
  async generateQRCode(otpauthUrl: string) {
    const response = await api.post('/totp/qrcode', { otpauthUrl })
    return response.data
  },

  
  async validateCode(secret: string, code: string) {
    const response = await api.post('/totp/validate', { secret, code })
    return response.data
  },

  
  async parseOtpAuthUrl(otpauthUrl: string) {
    const response = await api.post('/totp/parse', { otpauthUrl })
    return response.data
  },

  
  async testCodes(secret: string) {
    const response = await api.post('/totp/test', { secret })
    return response.data
  },

  

  
  async getTotpCode(passwordId: string) {
    const response = await api.get(`/totp/passwords/${passwordId}`)
    return response.data
  },

  
  async getTotpSecret(passwordId: string) {
    const response = await api.get(`/totp/passwords/${passwordId}/secret`)
    return response.data
  },

  
  async addTotpToPassword(passwordId: string, totpInput: string) {
    const response = await api.post(`/totp/passwords/${passwordId}`, {
      totpInput
    })
    return response.data
  },

  
  async removeTotpFromPassword(passwordId: string) {
    const response = await api.delete(`/totp/passwords/${passwordId}`)
    return response.data
  }
}

export default totpApi

