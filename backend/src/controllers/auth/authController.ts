import express from 'express';
import crypto from 'crypto-js';
import { AuthService } from '../../services/auth/authService';
import { UserService } from '../../services/users/userService';
import { authenticateToken, accountLimiter } from '../../middleware/auth';
import { verifyPassword } from '../../utils/credentialUtil';
import { prisma } from '../../infrastructure/prisma';
import { AuditUtil } from '../../utils/auditUtil';
import { AuthenticatedRequest } from '../../types/express';
import { authLimiter } from '../../middleware/auth';
import { clearSessionCookie, issueCsrfCookie, parseCookies, SESSION_COOKIE_NAME, setSessionCookie } from '../../middleware/cookies';

const router = express.Router();
const authService = new AuthService();

router.get('/csrf', (_req, res) => {
  issueCsrfCookie(res);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, message: 'Token CSRF emitido' });
});

router.get('/setup-status', async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: { needsSetup: !(await authService.hasUsers()) } });
  } catch {
    res.status(503).json({ success: false, message: 'Serviço temporariamente indisponível' });
  }
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, masterPassword } = req.body;
    
    const user = await authService.register({
      email,
      masterPassword,
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Usuário criado com sucesso'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});


router.post('/login', authLimiter, accountLimiter, async (req, res) => {
  try {
    const { email, masterPassword, deviceName } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await authService.login({
      email,
      masterPassword,
      deviceName,
    }, ipAddress, userAgent);

    setSessionCookie(res, result.token);
    res.json({
      success: true,
      data: {
        user: result.user,
        sessionId: result.sessionId,
      },
      message: 'Login realizado com sucesso'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(401).json({
      success: false,
      message: errorMessage
    });
  }
});


router.post('/logout', authenticateToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const token = parseCookies(req.get('Cookie'))[SESSION_COOKIE_NAME];
    await authService.logout(authReq.user.id, token);
    clearSessionCookie(res);

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});


router.post('/refresh', authenticateToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const currentToken = parseCookies(req.get('Cookie'))[SESSION_COOKIE_NAME];
    const result = await authService.refreshToken(authReq.user.id, authReq.sessionId, currentToken);
    setSessionCookie(res, result.token);

    res.json({
      success: true,
      data: { sessionId: authReq.sessionId },
      message: 'Token renovado com sucesso'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(401).json({
      success: false,
      message: errorMessage
    });
  }
});


router.get('/me', authenticateToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const userService = new UserService();
    const user = await userService.getUserProfile(authReq.user.id);

    res.json({
      success: true,
      message: 'Usuário autenticado obtido com sucesso',
      data: {
        user: user
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(404).json({
      success: false,
      message: errorMessage
    });
  }
});


router.get('/sessions', authenticateToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const queryParams = req.query;
    const requestedLimit = queryParams['limit'] ? Number.parseInt(queryParams['limit'] as string, 10) : 50;
    const requestedOffset = queryParams['offset'] ? Number.parseInt(queryParams['offset'] as string, 10) : 0;
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
    const offset = Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0;
    
    const token = parseCookies(req.get('Cookie'))[SESSION_COOKIE_NAME];
    const tokenHash = token ? crypto.SHA256(token).toString() : undefined;
    const result = await authService.getUserSessions(authReq.user.id, tokenHash, limit, offset);

    res.json({
      success: true,
      message: 'Sessões obtidas com sucesso',
      data: result.sessions,
      pagination: {
        total: result.total,
        limit,
        offset
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const sessionId = req.params['sessionId'];
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Session ID é obrigatório' });
      return;
    }
    await authService.revokeSession(authReq.user.id, sessionId);

    res.json({
      success: true,
      message: 'Sessão revogada com sucesso'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

router.post('/forgot-password', authLimiter, accountLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    await authService.requestPasswordReset(email);

    return res.json({
      success: true,
      message: 'Se o email existir, você receberá um link de recuperação'
    });
  } catch {
    return res.json({ success: true, message: 'Se o email existir, você receberá um link de recuperação' });
  }
});

router.post('/reset-password', authLimiter, accountLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token e nova senha são obrigatórios'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 8 caracteres'
      });
    }

    await authService.resetPassword(token, newPassword);

    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

router.post('/change-password', authenticateToken, authLimiter, accountLimiter, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter pelo menos 8 caracteres'
      });
    }

    await authService.changeMasterPassword(authReq.user.id, currentPassword, newPassword);

    return res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});


router.post('/reauthenticate', authenticateToken, authLimiter, accountLimiter, async (req, res, next) => {
  try {
  if (!(await verifyPassword(req.body?.password, req.user!.masterPasswordHash))) {
    res.status(403).json({ success: false, message: 'Senha incorreta' });
    return;
  }
  const result = await prisma.userSession.updateMany({ where: { id: req.sessionId!, userId: req.user!.id, user: { masterPasswordHash: req.user!.masterPasswordHash, isActive: true } }, data: { reauthenticatedAt: new Date() } });
  if (result.count !== 1) { res.status(401).json({ success: false, message: 'Sessão inválida' }); return; }
  await AuditUtil.log(req.user!.id, 'REAUTHENTICATED', 'SESSION', req.sessionId, null, req);
  res.json({ success: true, message: 'Identidade confirmada por 5 minutos' });
  } catch (error) { next(error); }
});

export default router;
