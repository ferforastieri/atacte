import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { redisRateLimitStore } from './rateLimitStore';
import { NODE_ENV } from '../infrastructure/config';
import { prisma } from '../infrastructure/prisma';
import { AuthenticatedRequest } from '../types/express';
import { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS, JWT_AUDIENCE, JWT_ISSUER, JWT_SECRET, MUTATION_RATE_LIMIT_MAX, MUTATION_RATE_LIMIT_WINDOW_MS } from '../infrastructure/config';
import { SESSION_COOKIE_NAME, parseCookies } from './cookies';


export const authLimiter = rateLimit({
  store: NODE_ENV === 'test' ? undefined : redisRateLimitStore('auth-ip'),
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  message: { 
    success: false, 
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const mutationLimiter = rateLimit({
  store: NODE_ENV === 'test' ? undefined : redisRateLimitStore('mutation-ip'),
  windowMs: MUTATION_RATE_LIMIT_WINDOW_MS,
  max: MUTATION_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: { success: false, message: 'Muitas operações. Tente novamente em instantes.' },
});

function getSessionToken(req: Request): string | undefined {
  return parseCookies(req.get('Cookie'))[SESSION_COOKIE_NAME];
}


export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = getSessionToken(req);

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Token de acesso necessário' 
      });
      return;
    }

    
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as { 
      userId: string; 
      email: string; 
    };
    
    
    const tokenHash = crypto.SHA256(token).toString();
    
    const session = await prisma.userSession.findFirst({
      where: {
        userId: decoded.userId,
        tokenHash: tokenHash,
      },
      include: { user: true }
    });

    if (!session) {
      res.status(401).json({ 
        success: false, 
        message: 'Sessão inválida ou expirada' 
      });
      return;
    }

    if (!session.user.isActive) {
      res.status(401).json({ 
        success: false, 
        message: 'Sessão inválida ou expirada' 
      });
      return;
    }

    if (session.expiresAt && new Date() > session.expiresAt) {
      await prisma.userSession.delete({
        where: { id: session.id }
      });
      res.status(401).json({ 
        success: false, 
        message: 'Sessão expirada. Por favor, faça login novamente.' 
      });
      return;
    }

    try {
      const cutoff = new Date(Date.now() - 60000);
      if (session.lastUsed < cutoff) {
        await prisma.userSession.updateMany({
          where: { id: session.id, lastUsed: { lt: cutoff } },
          data: { lastUsed: new Date() }
        });
      }
    } catch (updateError) {
      
    }

    
    (req as AuthenticatedRequest).user = session.user;
    (req as AuthenticatedRequest).sessionId = session.id;
    req.reauthenticatedAt = session.reauthenticatedAt;
    
    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};


export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as AuthenticatedRequest).user;
  
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Não autenticado'
    });
    return;
  }

  if (user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar este recurso.'
    });
    return;
  }

  next();
};

export const accountLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  limit: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: NODE_ENV === 'test' ? undefined : redisRateLimitStore('auth-account'),
  keyGenerator: req => {
    const account = req.user?.id || (typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : undefined);
    return account ? req.path + ':' + account : req.path + ':' + ipKeyGenerator(req.ip || '127.0.0.1');
  },
  message: { success: false, message: 'Muitas tentativas. Aguarde antes de tentar novamente.' },
});

export function requireRecentAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.reauthenticatedAt || Date.now() - req.reauthenticatedAt.getTime() > 5 * 60000) {
    res.status(403).json({ success: false, requiresReauthentication: true, message: 'Confirme sua senha para continuar' });
    return;
  }
  next();
}
