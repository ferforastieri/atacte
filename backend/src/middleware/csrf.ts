import { Request, Response, NextFunction } from 'express';
import { CORS_ORIGIN } from '../infrastructure/config';
import { CSRF_COOKIE_NAME, parseCookies, secureTokenEqual } from './cookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const allowedOrigins = new Set(CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean));

function requestOrigin(req: Request): string {
  const forwardedProto = req.get('X-Forwarded-Proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  return `${protocol}://${req.get('host')}`;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.get('Origin') || req.get('Referer');
  if (origin) {
    try {
      const originUrl = new URL(origin).origin;
      const sameOrigin = originUrl === requestOrigin(req);
      if (allowedOrigins.size > 0 && !sameOrigin && !allowedOrigins.has(originUrl)) {
        res.status(403).json({ success: false, message: 'Origem não permitida' });
        return;
      }
    } catch {
      res.status(403).json({ success: false, message: 'Origem inválida' });
      return;
    }
  }

  const cookies = parseCookies(req.get('Cookie'));
  const headerToken = req.get('X-CSRF-Token');
  if (!secureTokenEqual(cookies[CSRF_COOKIE_NAME], headerToken)) {
    res.status(403).json({ success: false, message: 'Token CSRF inválido' });
    return;
  }
  next();
}
