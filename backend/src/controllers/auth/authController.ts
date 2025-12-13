import express from 'express';
import { AuthService } from '../../services/auth/authService';
import { authenticateToken } from '../../middleware/auth';

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
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
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
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});


router.post('/logout', authenticateToken, async (req: any, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await authService.logout(req.user.id, token);

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


router.post('/refresh', authenticateToken, async (req: any, res) => {
  try {
    const result = await authService.refreshToken(req.user.id);

    res.json({
      success: true,
      data: result,
      message: 'Token renovado com sucesso'
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});


router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await authService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});


router.get('/sessions', authenticateToken, async (req: any, res) => {
  try {
    const sessions = await authService.getUserSessions(req.user.id);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


router.delete('/sessions/:sessionId', authenticateToken, async (req: any, res) => {
  try {
    await authService.revokeSession(req.user.id, req.params.sessionId);

    res.json({
      success: true,
      message: 'Sessão revogada com sucesso'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
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

    const result = await authService.requestPasswordReset(email);

    return res.json({
      success: true,
      message: 'Se o email existir, você receberá um link de recuperação',
      data: process.env['NODE_ENV'] === 'development' && result.token ? { token: result.token } : undefined
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
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
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
