import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

function get(key: string, def: string): string {
  const v = process.env[key]
  return v !== undefined ? v : def
}

function getNum(key: string, def: number): number {
  const v = process.env[key]
  if (v === undefined) return def
  const n = parseInt(v, 10)
  if (Number.isNaN(n)) throw new Error(`Env ${key} must be a number`)
  return n
}

const PORT = getNum('PORT', 3001)
const NODE_ENV = get('NODE_ENV', 'development') as 'development' | 'production' | 'test'
const DATABASE_URL = get('DATABASE_URL', 'postgresql://localhost:5432/atacte')
const JWT_SECRET = get('JWT_SECRET', '')
const JWT_EXPIRES_IN = get('JWT_EXPIRES_IN', '7d')
const ENCRYPTION_KEY = get('ENCRYPTION_KEY', '')
const BCRYPT_ROUNDS = getNum('BCRYPT_ROUNDS', 12)
const RATE_LIMIT_WINDOW_MS = getNum('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000)
const RATE_LIMIT_MAX_REQUESTS = getNum('RATE_LIMIT_MAX_REQUESTS', 500)
const CORS_ORIGIN = get('CORS_ORIGIN', '*')
const LOG_LEVEL = get('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug'
const SMTP_HOST = get('SMTP_HOST', '')
const SMTP_PORT = get('SMTP_PORT', '')
const SMTP_USER = get('SMTP_USER', '')
const SMTP_PASS = get('SMTP_PASS', '')
const EMAIL_FROM = get('EMAIL_FROM', '')
const EMAIL_FROM_NAME = get('EMAIL_FROM_NAME', '')
const PASSWORD_RESET_URL = get('PASSWORD_RESET_URL', '')

if (!DATABASE_URL.startsWith('postgresql://'))
  throw new Error('DATABASE_URL must be a PostgreSQL URL')
if (!JWT_SECRET || JWT_SECRET.length < 32)
  throw new Error('JWT_SECRET must be at least 32 characters')
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32)
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters')

export const env = {
  PORT,
  NODE_ENV,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ENCRYPTION_KEY,
  BCRYPT_ROUNDS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  CORS_ORIGIN,
  LOG_LEVEL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  EMAIL_FROM_NAME,
  PASSWORD_RESET_URL,
  isDevelopment: NODE_ENV === 'development',
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
}

export default env
export type EnvironmentConfig = typeof env
export { PORT, NODE_ENV, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, ENCRYPTION_KEY, BCRYPT_ROUNDS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, CORS_ORIGIN, LOG_LEVEL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_FROM_NAME, PASSWORD_RESET_URL }
