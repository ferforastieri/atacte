import { CryptoUtil } from '../../utils/cryptoUtil'
import { ImportExportRepository } from '../../repositories/importExport/importExportRepository'

export interface BitwardenItem {
  passwordHistory: Array<{
    lastUsedDate: string
    password: string
  }>
  revisionDate: string
  creationDate: string
  deletedDate?: string | null
  id: string
  organizationId?: string | null
  folderId?: string | null
  type: number
  reprompt: number
  name: string
  notes?: string | null
  favorite: boolean
  fields: Array<{
    name: string
    value: string
    type: number
  }>
  login: {
    uris: Array<{
      match?: string | null
      uri: string
    }>
    username?: string | null
    password: string
    totp?: string | null
  }
  collectionIds?: string | null
  key?: string
}

export interface BitwardenImportData {
  encrypted: boolean
  folders: Array<{
    id: string
    name: string
    revisionDate: string
  }>
  items: BitwardenItem[]
}

export interface ImportResult {
  imported: number
  duplicates: number
  errors: string[]
}

export interface ExportResult {
  data: any
  total: number
}

class ImportExportService {
  private importExportRepository: ImportExportRepository;

  constructor() {
    this.importExportRepository = new ImportExportRepository();
  }

  
  async importFromBitwarden(userId: string, importData: BitwardenImportData): Promise<ImportResult> {
    const { items } = importData

    
    if (!Array.isArray(items)) {
      throw new Error('Formato JSON inválido. Esperado um array de "items"')
    }

    
    const user = await this.importExportRepository.getUserEncryptionKey(userId)

    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    let imported = 0
    let duplicates = 0
    const errors: string[] = []

    
    for (const item of items) {
      try {
        
        if (item.type !== 1 || !item.login) {
          continue
        }

        const name = item.name || 'Item sem nome'
        const website = item.login.uris?.[0]?.uri || null
        const username = item.login.username || null
        const password = item.login.password || ''
        const notes = item.notes || null
        const isFavorite = item.favorite || false
        const totpSecret = item.login.totp || null

        

        
        const encryptedPassword = CryptoUtil.encrypt(password, user.encryptionKeyHash)
        
        
        const encryptedTotpSecret = totpSecret ? CryptoUtil.encrypt(totpSecret, user.encryptionKeyHash) : null

        
        await this.importExportRepository.createPasswordEntry({
          userId,
          name,
          website: website ?? undefined,
          username: username ?? undefined,
          encryptedPassword,
          notes: notes ?? undefined,
          isFavorite,
          totpSecret: encryptedTotpSecret ?? undefined,
          totpEnabled: !!totpSecret
        })

        imported++

      } catch (itemError: any) {
        errors.push(`Erro ao importar "${item.name || 'Item sem nome'}": ${itemError.message}`)
      }
    }

    return {
      imported,
      duplicates,
      errors
    }
  }

  
  async exportToBitwarden(userId: string): Promise<ExportResult> {
    
    const passwords = await this.importExportRepository.findUserPasswords(userId)

    
    const items = passwords.map((password) => ({
      passwordHistory: [], 
      revisionDate: password.updatedAt.toISOString(),
      creationDate: password.createdAt.toISOString(),
      deletedDate: null,
      id: password.id,
      organizationId: null,
      folderId: null,
      type: 1, 
      reprompt: 0,
      name: password.name,
      notes: password.notes,
      favorite: password.isFavorite,
      fields: (password as any).customFields?.map((field: any) => ({
        name: field.fieldName,
        value: field.value,
        type: 0 
      })) || [],
      login: {
        uris: password.website ? [{
          match: null,
          uri: password.website
        }] : [],
        username: password.username,
        password: password.encryptedPassword, 
        totp: password.totpSecret ? Buffer.from(password.totpSecret, 'base64').toString() : null
      },
      collectionIds: null
    }))

    const exportData = {
      encrypted: false,
      folders: [], 
      items
    }

    return {
      data: exportData,
      total: passwords.length
    }
  }

  
  async exportToCSV(userId: string): Promise<ExportResult> {
    const passwords = await this.importExportRepository.findUserPasswords(userId)

    
    const headers = [
      'Nome',
      'Website',
      'Usuário',
      'Senha',
      'Notas',
      'Pasta',
      'Favorito',
      'TOTP Habilitado',
      'Data de Criação',
      'Última Atualização'
    ]

    
    const csvRows = [headers.join(',')]
    
    passwords.forEach(password => {
      const row = [
        `"${password.name}"`,
        `"${password.website || ''}"`,
        `"${password.username || ''}"`,
        `"${password.encryptedPassword}"`, 
        `"${password.notes || ''}"`,
        `"${password.folder || ''}"`,
        password.isFavorite ? 'Sim' : 'Não',
        password.totpEnabled ? 'Sim' : 'Não',
        password.createdAt.toISOString(),
        password.updatedAt.toISOString()
      ]
      csvRows.push(row.join(','))
    })

    return {
      data: csvRows.join('\n'),
      total: passwords.length
    }
  }

  
  validateImportData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data || typeof data !== 'object') {
      errors.push('Dados de importação inválidos')
      return { valid: false, errors }
    }

    if (typeof data.encrypted !== 'boolean') {
      errors.push('Campo "encrypted" é obrigatório')
    }

    if (!Array.isArray(data.items)) {
      errors.push('Campo "items" deve ser um array')
    }

    if (data.items && data.items.length === 0) {
      errors.push('Nenhum item encontrado para importar')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export default new ImportExportService()
