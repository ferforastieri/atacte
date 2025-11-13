import { Request } from 'express';
import { User } from '../infrastructure/prisma';

// Estender o tipo Request do Express globalmente
// Isso permite que todos os Request handlers tenham acesso a user e sessionId
// quando o middleware authenticateToken for aplicado
declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

// Tipo helper para garantir que user e sessionId estão presentes
export interface AuthenticatedRequest extends Request {
  user: User;
  sessionId: string;
}

export {};
