import { RequestHandler, Response, NextFunction, Request } from 'express';
import type { AuthenticatedRequest } from './express.d';

export type { AuthenticatedRequest } from './express.d';

export function asAuthenticatedHandler(
  handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> | void
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.sessionId) {
      res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
      return;
    }
    
    return handler(req as AuthenticatedRequest, res, next);
  };
}

