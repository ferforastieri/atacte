import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { LocationService } from '../../services/location/locationService';

const router = Router();
const locationService = new LocationService();

interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  batteryLevel?: number;
  isMoving?: boolean;
}

interface LocationHistoryQuery {
  startDate: string;
  endDate: string;
  limit?: string;
}

interface FamilyLocationQuery {
  familyId: string;
}

// Validações
const updateLocationValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude deve estar entre -90 e 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude deve estar entre -180 e 180'),
  body('accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precisão deve ser um número positivo'),
  body('altitude')
    .optional()
    .isFloat()
    .withMessage('Altitude deve ser um número'),
  body('speed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Velocidade deve ser um número positivo'),
  body('heading')
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage('Direção deve estar entre 0 e 360'),
  body('batteryLevel')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Nível de bateria deve estar entre 0 e 1'),
  body('isMoving')
    .optional()
    .isBoolean()
    .withMessage('isMoving deve ser booleano'),
];

const historyValidation = [
  query('startDate')
    .isISO8601()
    .withMessage('Data inicial inválida'),
  query('endDate')
    .isISO8601()
    .withMessage('Data final inválida'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limite deve estar entre 1 e 1000'),
];

// Rotas
router.use(authenticateToken);

// Atualizar localização
router.post(
  '/',
  updateLocationValidation,
  async (req: Request<{}, {}, UpdateLocationRequest>, res: Response) => {
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
      const location = await locationService.updateLocation(
        authReq.user.id,
        req.body,
        authReq
      );

      res.status(201).json({
        success: true,
        message: 'Localização atualizada',
        data: location,
      });
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }
);

// Obter última localização
router.get('/latest', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const location = await locationService.getLatestLocation(req.user.id);

    if (!location) {
      res.status(404).json({
        success: false,
        message: 'Nenhuma localização encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error('Erro ao buscar localização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Obter histórico de localização
router.get(
  '/history',
  historyValidation,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Parâmetros inválidos',
          errors: errors.array(),
        });
        return;
      }
      const query = req.query as any;
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      const limit = query.limit ? parseInt(query.limit) : undefined;

      const locations = await locationService.getLocationHistory(
        req.user.id,
        startDate,
        endDate,
        limit
      );

      res.json({
        success: true,
        data: locations,
        count: locations.length,
      });
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }
);

// Obter localizações da família
router.get(
  '/family/:familyId',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { familyId } = req.params;

      const familyData = await locationService.getFamilyLocations(
        req.user.id,
        familyId
      );

      res.json({
        success: true,
        data: familyData,
      });
    } catch (error: any) {
      console.error('Erro ao buscar localizações da família:', error);
      res.status(error.message.includes('permissão') ? 403 : 500).json({
        success: false,
        message: error.message || 'Erro interno do servidor',
      });
    }
  }
);

// Obter estatísticas de localização
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await locationService.getLocationStats(req.user.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Limpar localizações antigas
router.delete('/cleanup', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const daysToKeep = req.query.days ? parseInt(req.query.days as string) : 30;
    const deletedCount = await locationService.cleanupOldLocations(
      req.user.id,
      daysToKeep
    );

    res.json({
      success: true,
      message: `${deletedCount} localizações antigas removidas`,
      data: { deletedCount },
    });
  } catch (error) {
    console.error('Erro ao limpar localizações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Solicitar atualização de localização para toda a família
router.post(
  '/request-update/:familyId',
  updateLocationValidation,
  async (req: AuthenticatedRequest, res: Response) => {
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

      const { familyId } = req.params;
      const body = req.body;

      const location = await locationService.requestFamilyLocationUpdate(
        req.user.id,
        familyId,
        body,
        req
      );

      res.status(201).json({
        success: true,
        message: 'Localização atualizada e família notificada',
        data: location,
      });
    } catch (error) {
      console.error('Erro ao solicitar atualização de localização:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      const statusCode = message.includes('permissão') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
);

export default router;

