import dotenv from 'dotenv'
import path from 'path'


dotenv.config({ path: path.join(__dirname, '../../../config.env') })

export interface EnvironmentConfig {
  
  PORT: number
  NODE_ENV: 'development' | 'production' | 'test'
  
  
  DATABASE_URL: string
  
  
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  
  
  ENCRYPTION_KEY: string
  
  
  BCRYPT_ROUNDS: number
  RATE_LIMIT_WINDOW_MS: number
  RATE_LIMIT_MAX_REQUESTS: number
  
  
  CORS_ORIGIN: string
  
  
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug'
}

class Environment {
  private config: EnvironmentConfig

  constructor() {
    this.config = this.loadConfig()
    this.validateConfig()
  }

  private loadConfig(): EnvironmentConfig {
    return {
      
      PORT: this.getNumber('PORT', 3001),
      NODE_ENV: this.getString('NODE_ENV', 'development') as 'development' | 'production' | 'test',
      
      
      DATABASE_URL: this.getString('DATABASE_URL', 'postgresql://localhost:5432/atacte'),
      
      
      JWT_SECRET: this.getString('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production'),
      JWT_EXPIRES_IN: this.getString('JWT_EXPIRES_IN', '7d'),
      
      
      ENCRYPTION_KEY: this.getString('ENCRYPTION_KEY', 'your-32-character-encryption-key-here'),
      
      
      BCRYPT_ROUNDS: this.getNumber('BCRYPT_ROUNDS', 12),
      RATE_LIMIT_WINDOW_MS: this.getNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), 
      RATE_LIMIT_MAX_REQUESTS: this.getNumber('RATE_LIMIT_MAX_REQUESTS', 500),
      
      
      CORS_ORIGIN: this.getString('CORS_ORIGIN', '*'),
      
      
      LOG_LEVEL: this.getString('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug'
    }
  }

  private getString(key: string, defaultValue: string): string {
    const value = process.env[key]
    return value !== undefined ? value : defaultValue
  }

  private getNumber(key: string, defaultValue: number): number {
    const value = process.env[key]
    if (value === undefined) return defaultValue
    
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a valid number`)
    }
    
    return parsed
  }

  private validateConfig(): void {
    const requiredFields: (keyof EnvironmentConfig)[] = [
      'DATABASE_URL',
      'JWT_SECRET',
      'ENCRYPTION_KEY'
    ]

    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`Required environment variable ${field} is not set`)
      }
    }

    
    if (this.config.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long')
    }

    if (this.config.ENCRYPTION_KEY.length !== 32) {
      throw new Error(`ENCRYPTION_KEY must be exactly 32 characters long, got ${this.config.ENCRYPTION_KEY.length}`)
    }

    if (!this.config.DATABASE_URL.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
    }
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key]
  }

  public getAll(): EnvironmentConfig {
    return { ...this.config }
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development'
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production'
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test'
  }
}


export const env = new Environment()


export const {
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
  LOG_LEVEL
} = env.getAll()

export default env
