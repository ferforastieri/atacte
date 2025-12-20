import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from '../../middleware/auth';
import { asAuthenticatedHandler } from '../../types/express';
import { SecureNoteService } from '../../services/secureNotes/secureNoteService';

const router = Router();
const secureNoteService = new SecureNoteService();

const createNoteValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Título é obrigatório e deve ter até 255 caracteres'),
  body('content')
    .notEmpty()
    .withMessage('Conteúdo é obrigatório'),
  body('folder')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Pasta deve ter até 255 caracteres'),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite deve ser booleano'),
];

const searchValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit deve ser um número inteiro positivo'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset deve ser >= 0'),
  query('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite deve ser boolean'),
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
    const sortByValue = queryParams['sortBy'] as string | undefined;
    const sortOrderValue = queryParams['sortOrder'] as string | undefined;
    const filters = {
      query: queryParams['query'] as string | undefined,
      folder: queryParams['folder'] as string | undefined,
      isFavorite: queryParams['isFavorite'] ? queryParams['isFavorite'] === 'true' : undefined,
      limit: queryParams['limit'] ? parseInt(queryParams['limit'] as string) : 50,
      offset: queryParams['offset'] ? parseInt(queryParams['offset'] as string) : 0,
      sortBy: (sortByValue === 'title' || sortByValue === 'createdAt' || sortByValue === 'updatedAt') ? (sortByValue as 'title' | 'createdAt' | 'updatedAt') : ('title' as const),
      sortOrder: (sortOrderValue === 'asc' || sortOrderValue === 'desc') ? (sortOrderValue as 'asc' | 'desc') : ('asc' as const)
    };

    const result = await secureNoteService.searchNotes(req.user.id, filters, req);

    res.json({
      success: true,
      data: result.notes,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset
      }
    });
  } catch (error) {
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
    const note = await secureNoteService.getNoteById(req.user.id, id);

    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Nota não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));

router.post('/', createNoteValidation, asAuthenticatedHandler(async (req, res) => {
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

    const noteData = req.body;
    
    const newNote = await secureNoteService.createNote(req.user.id, noteData, req);

    res.status(201).json({
      success: true,
      message: 'Nota criada com sucesso',
      data: newNote
    });
  } catch (error) {
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
    const updateData = req.body;

    const updatedNote = await secureNoteService.updateNote(req.user.id, id, updateData, req);

    if (!updatedNote) {
      res.status(404).json({
        success: false,
        message: 'Nota não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Nota atualizada com sucesso',
      data: updatedNote
    });
  } catch (error) {
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
    const deleted = await secureNoteService.deleteNote(req.user.id, id, req);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Nota não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Nota deletada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));

router.get('/folders/list', asAuthenticatedHandler(async (req, res) => {
  try {
    const folders = await secureNoteService.getUserFolders(req.user.id);

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

export default router;

