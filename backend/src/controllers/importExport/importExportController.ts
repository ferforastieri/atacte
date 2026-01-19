import { Router } from 'express'
import importExportService from '../../services/importExport/importExportService'
import { ImportExportRepository } from '../../repositories/importExport/importExportRepository'
import { authenticateToken } from '../../middleware/auth'
import { asAuthenticatedHandler } from '../../types/express'

const router = Router()
const importExportRepository = new ImportExportRepository()


router.use(authenticateToken)



router.post('/import', asAuthenticatedHandler(async (req, res) => {
  try {
    const userId = req.user.id
    const importData = req.body

    
    const validation = importExportService.validateImportData(importData)
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: 'Dados de importação inválidos',
        errors: validation.errors
      })
      return
    }

    
    const result = await importExportService.importFromBitwarden(userId, importData)

    
    await importExportRepository.createAuditLog({
      userId,
      action: 'IMPORT_PASSWORDS',
      details: { 
        imported: result.imported, 
        duplicates: result.duplicates,
        message: `Importação de ${result.imported} senhas, ${result.duplicates} duplicatas ignoradas`
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    })

    res.json({
      success: true,
      data: result,
      message: `Importação concluída: ${result.imported} senhas importadas, ${result.duplicates} duplicatas ignoradas`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor durante a importação'
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante a importação',
      error: errorMessage
    })
  }
}))



router.get('/export/bitwarden', asAuthenticatedHandler(async (req, res) => {
  try {
    const userId = req.user.id

    
    const result = await importExportService.exportToBitwarden(userId)

    
    await importExportRepository.createAuditLog({
      userId,
      action: 'EXPORT_PASSWORDS',
      details: { message: `Exportação de ${result.total} senhas para formato Bitwarden` },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    })

    
    const filename = `sentro-passwords-${new Date().toISOString().split('T')[0]}.json`
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    res.json({
      success: true,
      data: result.data,
      message: `Exportação concluída: ${result.total} senhas exportadas`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor durante a exportação'
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante a exportação',
      error: errorMessage
    })
  }
}))


router.get('/export/csv', asAuthenticatedHandler(async (req, res) => {
  try {
    const userId = req.user.id

    
    const result = await importExportService.exportToCSV(userId)

    
    await importExportRepository.createAuditLog({
      userId,
      action: 'EXPORT_PASSWORDS',
      details: { message: `Exportação de ${result.total} senhas para formato CSV` },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    })

    
    const filename = `sentro-passwords-${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    res.send(result.data)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor durante a exportação CSV'
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante a exportação CSV',
      error: errorMessage
    })
  }
}))

export default router
