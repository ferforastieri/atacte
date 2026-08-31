import { Router } from 'express'
import { BUILD_VERSION, UPDATER_TOKEN, UPDATER_URL, env } from '../../infrastructure/config'
import { authenticateToken, requireAdmin } from '../../middleware/auth'
import { asAuthenticatedHandler } from '../../types/express'

const router = Router()
const configurableKeys = [
  'COOKIE_SECURE', 'COOKIE_SAME_SITE', 'COOKIE_DOMAIN', 'CORS_ORIGIN', 'TRUST_PROXY',
  'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX_REQUESTS', 'AUTH_RATE_LIMIT_MAX', 'AUTH_RATE_LIMIT_WINDOW_MS',
  'MUTATION_RATE_LIMIT_MAX', 'MUTATION_RATE_LIMIT_WINDOW_MS', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER',
  'SMTP_PASS', 'EMAIL_FROM', 'EMAIL_FROM_NAME', 'PASSWORD_RESET_URL', 'FRONT_PORT', 'BACKEND_PORT', 'POSTGRES_PORT',
] as const
type ConfigKey = typeof configurableKeys[number]

router.get('/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json({ success: true, data: { version: BUILD_VERSION } })
})

router.get('/config', authenticateToken, requireAdmin, asAuthenticatedHandler(async (_req, res) => {
  const values: Partial<Record<ConfigKey, string>> = {}
  for (const key of configurableKeys) {
    const value = env[key as keyof typeof env]
    values[key] = key === 'SMTP_PASS' ? '' : (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '')
  }
  res.json({ success: true, data: { values, secretFields: ['SMTP_PASS'] } })
}))

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

router.put('/config', authenticateToken, requireAdmin, asAuthenticatedHandler(async (req, res) => {
  if (!UPDATER_TOKEN) {
    res.status(503).json({ success: false, message: 'Atualizador não configurado nesta instalação' })
    return
  }
  const values = req.body?.values
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    res.status(400).json({ success: false, message: 'Configuração inválida' })
    return
  }
  const filtered: Record<string, string> = {}
  for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
    if (!(configurableKeys as readonly string[]).includes(key) || typeof value !== 'string' || value.length > 512 || /[\r\n]/.test(value)) {
      res.status(400).json({ success: false, message: 'Chave ou valor de configuração inválido' })
      return
    }
    if (key === 'SMTP_PASS' && value === '') continue
    filtered[key] = value
  }
  try {
    const response = await fetch(`${UPDATER_URL.replace(/\/$/, '')}/v1/config`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPDATER_TOKEN}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ values: filtered }),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      res.status(response.status === 401 ? 502 : response.status).json({ success: false, message: 'Não foi possível salvar a configuração' })
      return
    }
    res.status(202).json({ success: true, message: 'Configuração salva; serviços reiniciando' })
  } catch {
    res.status(502).json({ success: false, message: 'Atualizador indisponível' })
  }
}))

export default router
