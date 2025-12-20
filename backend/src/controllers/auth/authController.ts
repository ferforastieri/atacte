import express from 'express';
import crypto from 'crypto-js';
import { AuthService } from '../../services/auth/authService';
import { UserService } from '../../services/users/userService';
import { authenticateToken } from '../../middleware/auth';
import { AuthenticatedRequest } from '../../types/express';

const router = express.Router();
const authService = new AuthService();

router.post('/register', async (req, res) => {
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


router.post('/login', async (req, res) => {
  try {
    const { email, masterPassword, deviceName } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await authService.login({
      email,
      masterPassword,
      deviceName,
    }, ipAddress, userAgent);

    res.json({
      success: true,
      data: result,
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
    const token = req.headers.authorization?.split(' ')[1];
    await authService.logout(authReq.user.id, token);

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
    const result = await authService.refreshToken(authReq.user.id);

    res.json({
      success: true,
      data: result,
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
    const limit = queryParams['limit'] ? parseInt(queryParams['limit'] as string) : 50;
    const offset = queryParams['offset'] ? parseInt(queryParams['offset'] as string) : 0;
    
    const token = req.headers.authorization?.split(' ')[1];
    const tokenHash = token ? crypto.SHA256(token).toString() : undefined;
    const result = await authService.getUserSessions(authReq.user.id, tokenHash, limit, offset);

    res.json({
      success: true,
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

router.post('/trust-device', authenticateToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: 'ID da sessão é obrigatório'
      });
      return;
    }

    await authService.trustDevice(authReq.user.id, sessionId);

    res.json({
      success: true,
      message: 'Dispositivo confiado com sucesso'
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

router.post('/untrust-device', authenticateToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { deviceName } = req.body;
    if (!deviceName) {
      res.status(400).json({
        success: false,
        message: 'Nome do dispositivo é obrigatório'
      });
      return;
    }

    await authService.untrustDevice(authReq.user.id, deviceName);

    res.json({
      success: true,
      message: 'Confiança removida do dispositivo com sucesso'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

router.post('/forgot-password', async (req, res) => {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

router.post('/reset-password', async (req, res) => {
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

router.post('/change-password', authenticateToken, async (req, res) => {
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

export default router;
