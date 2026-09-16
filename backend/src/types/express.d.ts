import { Request } from 'express';
import { User } from '../infrastructure/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
      reauthenticatedAt?: Date | null;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
  sessionId: string;
}

export {};
