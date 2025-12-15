import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { asAuthenticatedHandler } from '../../types/express';
import { UserService } from '../../services/users/userService';

const router = Router();
const userService = new UserService();



router.use(authenticateToken);


router.get('/profile', asAuthenticatedHandler(async (req, res) => {
  try {
    const userProfile = await userService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.get('/stats', asAuthenticatedHandler(async (req, res) => {
  try {
    const stats = await userService.getUserStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.get('/folders', asAuthenticatedHandler(async (req, res) => {
  try {
    const folders = await userService.getUserFolders(req.user.id);

    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.get('/audit-logs', asAuthenticatedHandler(async (req, res) => {
  try {
    const queryParams = req.query;
    
    const limit = queryParams['limit'] ? parseInt(queryParams['limit'] as string) : 50;
    const offset = queryParams['offset'] ? parseInt(queryParams['offset'] as string) : 0;
    const query = queryParams['query'] as string | undefined;
    const action = queryParams['action'] as string | undefined;
    const filterUserId = queryParams['userId'] as string | undefined;
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (queryParams['startDate']) {
      startDate = new Date(queryParams['startDate'] as string);
      startDate.setHours(0, 0, 0, 0);
    }
    
    if (queryParams['endDate']) {
      endDate = new Date(queryParams['endDate'] as string);
      endDate.setHours(23, 59, 59, 999);
    }
    
    const targetUserId = filterUserId && req.user.role === 'ADMIN' ? filterUserId : req.user.id;
    
    const auditLogs = await userService.getUserAuditLogs(targetUserId, { 
      limit, 
      offset,
      query,
      action,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: auditLogs.logs,
      pagination: {
        total: auditLogs.total,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('[AUDIT LOGS CONTROLLER] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.post('/export', asAuthenticatedHandler(async (req, res) => {
  try {
    const exportData = await userService.exportUserData(req.user.id, req);

    res.json({
      success: true,
      message: 'Dados exportados com sucesso',
      data: exportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.delete('/account', asAuthenticatedHandler(async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Senha é obrigatória para deletar a conta'
      });
      return;
    }

    await userService.deleteUserAccount(req.user.id, password, req);

    res.json({
      success: true,
      message: 'Conta deletada com sucesso'
    });
  } catch (error: any) {
    const statusCode = error.message === 'Senha incorreta' ? 401 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
}));

router.patch(
  '/profile',
  [
    body('name').optional().trim().isLength({ max: 255 }).withMessage('Nome deve ter até 255 caracteres'),
    body('phoneNumber').optional().trim().isMobilePhone('any').withMessage('Número de telefone inválido'),
    body('profilePicture').optional().isURL().withMessage('URL da foto inválida'),
  ],
  asAuthenticatedHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
        return;
      }

      const updatedProfile = await userService.updateUserProfile(req.user.id, req.body, req);

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: updatedProfile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  })
);

router.patch(
  '/push-token',
  [
    body('pushToken').notEmpty().withMessage('Push token é obrigatório'),
  ],
  asAuthenticatedHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
        return;
      }

      await userService.updatePushToken(req.user.id, req.body.pushToken);

      res.json({
        success: true,
        message: 'Push token atualizado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  })
);

router.get('/admin/users', requireAdmin, asAuthenticatedHandler(async (_req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
}));

router.patch(
  '/admin/users/:userId',
  requireAdmin,
  [
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('name').optional().trim().isLength({ max: 255 }).withMessage('Nome deve ter até 255 caracteres'),
    body('phoneNumber').optional().trim().isMobilePhone('any').withMessage('Número de telefone inválido'),
    body('isActive').optional().isBoolean().withMessage('isActive deve ser um booleano'),
    body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Role deve ser USER ou ADMIN'),
  ],
  asAuthenticatedHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
        return;
      }

      const userId = req.params['userId'];
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório'
        });
        return;
      }
      const updatedUser = await userService.updateUserByAdmin(req.user.id, userId, req.body, req);

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: updatedUser
      });
    } catch (error: any) {
      const statusCode = error.message === 'Usuário não encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  })
);

router.post(
  '/admin/users/:userId/change-password',
  requireAdmin,
  [
    body('newPassword').notEmpty().isLength({ min: 8 }).withMessage('Nova senha deve ter pelo menos 8 caracteres'),
  ],
  asAuthenticatedHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
        return;
      }

      const userId = req.params['userId'];
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório'
        });
        return;
      }
      await userService.changeUserPasswordByAdmin(req.user.id, userId, req.body.newPassword, req);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error: any) {
      const statusCode = error.message === 'Usuário não encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  })
);

export default router;
