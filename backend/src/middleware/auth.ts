import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import rateLimit from 'express-rate-limit';
import { prisma } from '../infrastructure/prisma';
import { AuthenticatedRequest } from '../types/express';


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { 
    success: false, 
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});


export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Token de acesso necessário' 
      });
      return;
    }

    
    const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as { 
      userId: string; 
      email: string; 
    };
    
    
    const tokenHash = crypto.SHA256(token).toString();
    
    const session = await prisma.userSession.findFirst({
      where: {
        userId: decoded.userId,
        tokenHash: tokenHash,
      },
      include: { 
        user: {
          include: {
            preferences: true
          }
        }
      }
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

    const allowedPathsWithoutTrust = ['/api/auth/trust-device', '/api/auth/me', '/api/auth/logout', '/auth/trust-device', '/auth/me', '/auth/logout'];
    const path = req.path;
    const originalUrl = req.originalUrl || req.url;
    
    const isAllowedPath = allowedPathsWithoutTrust.some(allowed => 
      path === allowed || 
      path.includes(allowed) || 
      originalUrl.includes(allowed) ||
      originalUrl === allowed
    );

    if (!session.isTrusted && !isAllowedPath) {
      res.status(403).json({ 
        success: false, 
        message: 'Dispositivo não confiável. Por favor, confirme este dispositivo.',
        requiresTrust: true,
        sessionId: session.id,
        deviceName: session.deviceName,
        ipAddress: session.ipAddress
      });
      return;
    }

    
    try {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastUsed: new Date() }
      });
    } catch (updateError) {
      
    }

    
    (req as AuthenticatedRequest).user = session.user;
    (req as AuthenticatedRequest).sessionId = session.id;
    
    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};


export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as { 
      userId: string; 
      email: string; 
    };
    
    const session = await prisma.userSession.findFirst({
      where: {
        userId: decoded.userId,
        tokenHash: crypto.SHA256(token).toString(),
      },
      include: { 
        user: {
          include: {
            preferences: true
          }
        }
      }
    });

    if (session && session.user.isActive) {
      if (session.expiresAt && new Date() > session.expiresAt) {
        await prisma.userSession.delete({
          where: { id: session.id }
        });
      } else {
      (req as AuthenticatedRequest).user = session.user;
      (req as AuthenticatedRequest).sessionId = session.id;
      }
    }
    
    next();
  } catch (error) {
    
    next();
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
