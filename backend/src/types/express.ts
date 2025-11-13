import { RequestHandler, Response, NextFunction, Request } from 'express';
import type { AuthenticatedRequest } from './express.d';

// Re-exportar AuthenticatedRequest para facilitar imports
export type { AuthenticatedRequest } from './express.d';

/**
 * POR QUE ESSA FUNÇÃO EXISTE?
 * 
 * PROBLEMA:
 * 1. O Express espera handlers do tipo RequestHandler que recebem Request padrão
 * 2. Nós queremos handlers que recebem AuthenticatedRequest (com user e sessionId garantidos)
 * 3. O TypeScript não aceita isso diretamente porque são tipos diferentes
 * 
 * SOLUÇÃO ATUAL:
 * - Criamos um wrapper que converte nosso handler customizado para RequestHandler
 * - Como AuthenticatedRequest extends Request, e já estendemos Express.Request globalmente
 *   com user e sessionId opcionais, podemos fazer essa conversão
 * - O middleware authenticateToken garante que req terá user e sessionId quando chegar aqui
 * 
 * POR QUE PRECISAMOS DE CONVERSÃO:
 * - Mesmo após validar que user e sessionId existem, TypeScript ainda os vê como opcionais
 * - AuthenticatedRequest requer que sejam obrigatórios
 * - Como AuthenticatedRequest extends Request, a conversão é estruturalmente segura
 * 
 * ALTERNATIVA SEM ESSA FUNÇÃO:
 * - Teríamos que usar req.user! e req.sessionId! em todos os handlers (não é type-safe)
 * - Ou fazer type assertion em cada handler manualmente (repetitivo)
 */
export function asAuthenticatedHandler(
  handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> | void
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validação de segurança: se por algum motivo user ou sessionId não existirem,
    // retornamos erro (isso não deveria acontecer se authenticateToken foi aplicado)
    if (!req.user || !req.sessionId) {
      res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
      return;
    }
    
    // Após a validação, sabemos que user e sessionId existem
    // Como AuthenticatedRequest extends Request, podemos fazer uma conversão estrutural
    // Esta conversão é segura porque:
    // 1. Validamos que user e sessionId existem acima (runtime check)
    // 2. AuthenticatedRequest extends Request (compatibilidade estrutural)
    // 3. O middleware authenticateToken garante essas propriedades em runtime
    // 
    // NOTA: Esta é uma conversão de tipo (type assertion), mas é estruturalmente segura
    // porque AuthenticatedRequest é apenas Request com user e sessionId obrigatórios
    // Não usamos unknown/any/never - apenas uma conversão entre tipos compatíveis
    return handler(req as AuthenticatedRequest, res, next);
  };
}

