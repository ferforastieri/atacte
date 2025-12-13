import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../../middleware/auth';
import { FamilyService } from '../../services/family/familyService';
import { asAuthenticatedHandler, AuthenticatedRequest } from '../../types/express';

const router = Router();
const familyService = new FamilyService();

interface CreateFamilyRequest {
  name: string;
  description?: string;
}

interface UpdateFamilyRequest {
  name?: string;
  description?: string;
}

interface JoinFamilyRequest {
  inviteCode: string;
  nickname?: string;
}

interface UpdateMemberSettingsRequest {
  nickname?: string;
  shareLocation?: boolean;
  showOnMap?: boolean;
}

interface UpdateMemberRoleRequest {
  role: string;
}

const createFamilyValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome é obrigatório e deve ter até 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter até 500 caracteres'),
];

const joinFamilyValidation = [
  body('inviteCode')
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage('Código de convite inválido'),
  body('nickname')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Apelido deve ter até 50 caracteres'),
];

const updateMemberRoleValidation = [
  body('role')
    .isIn(['admin', 'member'])
    .withMessage('Função deve ser "admin" ou "member"'),
];

router.use(authenticateToken);

router.get('/', asAuthenticatedHandler(async (req, res) => {
  try {
    const families = await familyService.getUserFamilies(req.user.id);

    res.json({
      success: true,
      data: families,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
}));

router.get('/:id', asAuthenticatedHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID da família é obrigatório',
      });
      return;
    }
    const family = await familyService.getFamilyById(req.user.id, id);

    if (!family) {
      res.status(404).json({
        success: false,
        message: 'Família não encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: family,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    res.status(errorMessage.includes('permissão') ? 403 : 500).json({
      success: false,
      message: errorMessage,
    });
  }
}));

router.post(
  '/',
  createFamilyValidation,
  async (req: Request<{}, {}, CreateFamilyRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array(),
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const family = await familyService.createFamily(
        authReq.user.id,
        req.body,
        authReq
      );

      res.status(201).json({
        success: true,
        message: 'Família criada com sucesso',
        data: family,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }
);

router.put(
  '/:id',
  createFamilyValidation,
  asAuthenticatedHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID da família é obrigatório',
        });
        return;
      }
      const updateData = req.body as UpdateFamilyRequest;

      const family = await familyService.updateFamily(
        req.user.id,
        id,
        updateData,
        req
      );

      if (!family) {
        res.status(404).json({
          success: false,
          message: 'Família não encontrada',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Família atualizada com sucesso',
        data: family,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(errorMessage.includes('admin') ? 403 : 500).json({
        success: false,
        message: errorMessage,
      });
    }
  })
);

router.delete('/:id', asAuthenticatedHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID da família é obrigatório',
      });
      return;
    }
    await familyService.deleteFamily(req.user.id, id, req);

    res.json({
      success: true,
      message: 'Família excluída com sucesso',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    res.status(errorMessage.includes('admin') ? 403 : 500).json({
      success: false,
      message: errorMessage,
    });
  }
}));

router.post(
  '/join',
  joinFamilyValidation,
  async (req: Request<{}, {}, JoinFamilyRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array(),
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      
      const family = await familyService.joinFamily(
        authReq.user.id,
        req.body,
        authReq
      );

      res.status(201).json({
        success: true,
        message: 'Você entrou na família com sucesso',
        data: family,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao entrar na família';
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  }
);

router.post('/:id/leave', asAuthenticatedHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID da família é obrigatório',
      });
      return;
    }
    await familyService.leaveFamily(req.user.id, id, req);

    res.json({
      success: true,
      message: 'Você saiu da família',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao sair da família';
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
}));

router.delete(
  '/:id/members/:userId',
  asAuthenticatedHandler(async (req, res) => {
    try {
      const { id, userId } = req.params;
      if (!id || !userId) {
        res.status(400).json({
          success: false,
          message: 'ID da família e ID do usuário são obrigatórios',
        });
        return;
      }
      await familyService.removeMember(req.user.id, id, userId, req);

      res.json({
        success: true,
        message: 'Membro removido com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover membro';
      res.status(errorMessage.includes('admin') ? 403 : 400).json({
        success: false,
        message: errorMessage,
      });
    }
  })
);

router.patch(
  '/:id/members/:userId/role',
  updateMemberRoleValidation,
  asAuthenticatedHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array(),
        });
        return;
      }

      const { id, userId } = req.params;
      if (!id || !userId) {
        res.status(400).json({
          success: false,
          message: 'ID da família e ID do usuário são obrigatórios',
        });
        return;
      }
      const body = req.body as UpdateMemberRoleRequest;
      const { role } = body;

      const member = await familyService.updateMemberRole(
        req.user.id,
        id,
        userId,
        role,
        req
      );

      res.json({
        success: true,
        message: 'Função do membro atualizada',
        data: member,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar função';
      res.status(errorMessage.includes('admin') ? 403 : 400).json({
        success: false,
        message: errorMessage,
      });
    }
  })
);

router.patch(
  '/:id/settings',
  asAuthenticatedHandler(async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID da família é obrigatório',
        });
        return;
      }
      const settingsData = req.body as UpdateMemberSettingsRequest;

      const member = await familyService.updateMemberSettings(
        req.user.id,
        id,
        settingsData,
        req
      );

      res.json({
        success: true,
        message: 'Configurações atualizadas',
        data: member,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar configurações';
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  })
);

export default router;

