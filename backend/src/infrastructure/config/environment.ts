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
const AUTH_RATE_LIMIT_MAX = getNum('AUTH_RATE_LIMIT_MAX', 5)
const AUTH_RATE_LIMIT_WINDOW_MS = getNum('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000)
const MUTATION_RATE_LIMIT_MAX = getNum('MUTATION_RATE_LIMIT_MAX', 120)
const MUTATION_RATE_LIMIT_WINDOW_MS = getNum('MUTATION_RATE_LIMIT_WINDOW_MS', 60 * 1000)
const CORS_ORIGIN = get('CORS_ORIGIN', 'http://localhost:3000')
const TRUST_PROXY = getNum('TRUST_PROXY', 0)
const COOKIE_SECURE = get('COOKIE_SECURE', NODE_ENV === 'production' ? 'true' : 'false') === 'true'
const COOKIE_SAME_SITE = get('COOKIE_SAME_SITE', 'lax').toLowerCase() as 'strict' | 'lax' | 'none'
const COOKIE_DOMAIN = get('COOKIE_DOMAIN', '')
const COOKIE_MAX_AGE_MS = getNum('COOKIE_MAX_AGE_MS', 30 * 24 * 60 * 60 * 1000)
const JWT_ISSUER = get('JWT_ISSUER', 'atacte-api')
const JWT_AUDIENCE = get('JWT_AUDIENCE', 'atacte-clients')
const BUILD_VERSION = get('BUILD_VERSION', 'development')
const UPDATER_URL = get('UPDATER_URL', 'http://atacte-updater:8080')
const UPDATER_TOKEN = get('UPDATER_TOKEN', '')
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
if (!['strict', 'lax', 'none'].includes(COOKIE_SAME_SITE))
  throw new Error('COOKIE_SAME_SITE must be strict, lax or none')
if (COOKIE_SAME_SITE === 'none' && !COOKIE_SECURE)
  throw new Error('COOKIE_SECURE must be true when COOKIE_SAME_SITE is none')
if (CORS_ORIGIN.split(',').some((origin) => origin.trim() === '*'))
  throw new Error('CORS_ORIGIN cannot use wildcard origins with cookie authentication')

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
  AUTH_RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_WINDOW_MS,
  MUTATION_RATE_LIMIT_MAX,
  MUTATION_RATE_LIMIT_WINDOW_MS,
  CORS_ORIGIN,
  TRUST_PROXY,
  COOKIE_SECURE,
  COOKIE_SAME_SITE,
  COOKIE_DOMAIN,
  COOKIE_MAX_AGE_MS,
  JWT_ISSUER,
  JWT_AUDIENCE,
  BUILD_VERSION,
  UPDATER_URL,
  UPDATER_TOKEN,
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
export { PORT, NODE_ENV, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, ENCRYPTION_KEY, BCRYPT_ROUNDS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS, MUTATION_RATE_LIMIT_MAX, MUTATION_RATE_LIMIT_WINDOW_MS, CORS_ORIGIN, TRUST_PROXY, COOKIE_SECURE, COOKIE_SAME_SITE, COOKIE_DOMAIN, COOKIE_MAX_AGE_MS, JWT_ISSUER, JWT_AUDIENCE, BUILD_VERSION, UPDATER_URL, UPDATER_TOKEN, LOG_LEVEL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_FROM_NAME, PASSWORD_RESET_URL }
