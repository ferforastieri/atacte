import { Router } from 'express'
import { BUILD_VERSION, UPDATER_TOKEN, UPDATER_URL } from '../../infrastructure/config'
import { authenticateToken, requireAdmin } from '../../middleware/auth'
import { asAuthenticatedHandler } from '../../types/express'

const router = Router()

router.get('/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json({ success: true, data: { version: BUILD_VERSION } })
})

router.post('/update', authenticateToken, requireAdmin, asAuthenticatedHandler(async (_req, res) => {
  if (!UPDATER_TOKEN) {
    res.status(503).json({ success: false, message: 'Atualizador não configurado nesta instalação' })
    return
  }
  try {
    const response = await fetch(`${UPDATER_URL.replace(/\/$/, '')}/v1/update`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPDATER_TOKEN}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      res.status(response.status === 409 ? 409 : 502).json({ success: false, message: 'Não foi possível iniciar a atualização' })
      return
    }
    res.status(202).json({ success: true, data: { status: 'started' }, message: 'Atualização iniciada' })
  } catch {
    res.status(502).json({ success: false, message: 'Atualizador indisponível' })
  }
}))

export default router
