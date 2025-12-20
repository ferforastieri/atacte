import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from '../../middleware/auth';
import { asAuthenticatedHandler } from '../../types/express';
import { CalendarService } from '../../services/calendar/calendarService';

const router = Router();
const calendarService = new CalendarService();

const createEventValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Título é obrigatório e deve ter até 255 caracteres'),
  body('startDate')
    .notEmpty()
    .withMessage('Data de início é obrigatória')
    .isISO8601()
    .withMessage('Data de início deve ser uma data válida'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data de fim deve ser uma data válida'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter até 1000 caracteres'),
  body('isAllDay')
    .optional()
    .isBoolean()
    .withMessage('isAllDay deve ser booleano'),
  body('reminderMinutes')
    .optional()
    .isArray()
    .withMessage('reminderMinutes deve ser um array'),
  body('reminderMinutes.*')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Cada valor de reminderMinutes deve ser um número inteiro não negativo'),
  body('color')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Cor deve ter até 20 caracteres'),
  body('location')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Localização deve ter até 255 caracteres'),
  body('recurrenceType')
    .optional({ nullable: true })
    .isIn(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'])
    .withMessage('Tipo de repetição inválido'),
  body('recurrenceInterval')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Intervalo de repetição deve ser um número inteiro positivo'),
  body('recurrenceEndDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Data final de repetição deve ser uma data válida'),
  body('recurrenceDaysOfWeek')
    .optional({ nullable: true, checkFalsy: true })
    .isArray()
    .withMessage('Dias da semana deve ser um array'),
  body('recurrenceDaysOfWeek.*')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Cada dia da semana deve ser um número entre 0 e 6'),
  body('recurrenceDayOfMonth')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 31 })
    .withMessage('Dia do mês deve ser um número entre 1 e 31'),
  body('recurrenceWeekOfMonth')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: -1, max: 4 })
    .withMessage('Semana do mês deve ser um número entre -1 e 4'),
];

const searchValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate deve ser uma data válida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate deve ser uma data válida'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Limit deve ser um número inteiro entre 1 e 500'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset deve ser >= 0'),
];

router.use(authenticateToken);

router.get('/', searchValidation, asAuthenticatedHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos',
        errors: errors.array()
      });
      return;
    }

    const queryParams = req.query;
    const filters = {
      startDate: queryParams['startDate'] ? new Date(queryParams['startDate'] as string) : undefined,
      endDate: queryParams['endDate'] ? new Date(queryParams['endDate'] as string) : undefined,
      limit: queryParams['limit'] ? parseInt(queryParams['limit'] as string) : 100,
      offset: queryParams['offset'] ? parseInt(queryParams['offset'] as string) : 0,
    };

    const result = await calendarService.searchEvents(req.user.id, filters);

    res.json({
      success: true,
      data: result.events,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset
      }
    });
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));

router.get('/:id', asAuthenticatedHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID é obrigatório',
      });
      return;
    }
    const event = await calendarService.getEventById(req.user.id, id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));

router.post('/', createEventValidation, asAuthenticatedHandler(async (req, res) => {
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

    const eventData = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      recurrenceEndDate: req.body.recurrenceEndDate ? new Date(req.body.recurrenceEndDate) : undefined,
    };
    
    const newEvent = await calendarService.createEvent(req.user.id, eventData, req);

    res.status(201).json({
      success: true,
      message: 'Evento criado com sucesso',
      data: newEvent
    });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));

router.put('/:id', asAuthenticatedHandler(async (req, res) => {
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

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID é obrigatório',
      });
      return;
    }
    
    const updateData: {
      title?: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      isAllDay?: boolean;
      reminderMinutes?: number[];
      color?: string;
      location?: string;
      recurrenceType?: string | null;
      recurrenceInterval?: number | null;
      recurrenceEndDate?: Date | null;
      recurrenceDaysOfWeek?: number[];
      recurrenceDayOfMonth?: number | null;
      recurrenceWeekOfMonth?: number | null;
    } = { ...req.body };
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    if (updateData.recurrenceEndDate) {
      updateData.recurrenceEndDate = new Date(updateData.recurrenceEndDate);
    }

    const updatedEvent = await calendarService.updateEvent(req.user.id, id, updateData, req);

    if (!updatedEvent) {
      res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Evento atualizado com sucesso',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));

router.delete('/:id', asAuthenticatedHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID é obrigatório',
      });
      return;
    }
    const deleted = await calendarService.deleteEvent(req.user.id, id, req);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Evento deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));

export default router;

