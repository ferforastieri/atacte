import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from '../../middleware/auth';
import { asAuthenticatedHandler } from '../../types/express';
import { PasswordService } from '../../services/passwords/passwordService';

const router = Router();
const passwordService = new PasswordService();



const createPasswordValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome é obrigatório e deve ter até 255 caracteres'),
  body('website')
    .optional()
    .isURL()
    .withMessage('URL inválida'),
  body('username')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Username deve ter até 255 caracteres'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notas devem ter até 1000 caracteres'),
  body('folder')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Pasta deve ter até 255 caracteres'),
  body('totpSecret')
    .optional()
    .isString()
    .withMessage('Secret TOTP deve ser uma string')
    .custom((value) => {
      if (value) {
        
        const cleanValue = value.replace(/\s/g, '').toUpperCase();
        const base32Regex = /^[A-Z2-7]+=*$/;
        
        
        if (cleanValue.length < 16) {
          throw new Error('Chave TOTP muito curta. Deve ter pelo menos 16 caracteres.');
        }
        
        
        if (!base32Regex.test(cleanValue)) {
          throw new Error('Chave TOTP inválida. Deve conter apenas letras A-Z e números 2-7 (ex: ABCD EFGH IJKL MNOP)');
        }
        
        
        try {
          const speakeasy = require('speakeasy');
          const cleanSecret = value.replace(/\s/g, '').toUpperCase();
          speakeasy.totp({
            secret: cleanSecret,
            encoding: 'base32',
            step: 30
          });
        } catch (error) {
          throw new Error('Chave TOTP inválida. Verifique se a chave está correta.');
        }
      }
      return true;
    }),
  body('totpEnabled')
    .optional()
    .isBoolean()
    .withMessage('TOTP enabled deve ser booleano'),
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
  query('totpEnabled')
    .optional()
    .isBoolean()
    .withMessage('totpEnabled deve ser boolean'),
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
      totpEnabled: queryParams['totpEnabled'] ? queryParams['totpEnabled'] === 'true' : undefined,
      limit: queryParams['limit'] ? parseInt(queryParams['limit'] as string) : 50,
      offset: queryParams['offset'] ? parseInt(queryParams['offset'] as string) : 0,
      sortBy: (sortByValue === 'name' || sortByValue === 'createdAt' || sortByValue === 'updatedAt' || sortByValue === 'lastUsed') ? (sortByValue as 'name' | 'createdAt' | 'updatedAt' | 'lastUsed') : ('name' as const),
      sortOrder: (sortOrderValue === 'asc' || sortOrderValue === 'desc') ? (sortOrderValue as 'asc' | 'desc') : ('asc' as const)
    };

    const result = await passwordService.searchPasswords(req.user.id, filters, req);

    res.json({
      success: true,
      data: result.passwords,
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
    const password = await passwordService.getPasswordById(req.user.id, id, req);

    if (!password) {
      res.status(404).json({
        success: false,
        message: 'Senha não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: password
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.post('/', createPasswordValidation, asAuthenticatedHandler(async (req, res) => {
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

    const passwordData = req.body;
    
    const newPassword = await passwordService.createPassword(req.user.id, passwordData, req);

    res.status(201).json({
      success: true,
      message: 'Senha criada com sucesso',
      data: newPassword
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

    const updatedPassword = await passwordService.updatePassword(req.user.id, id, updateData, req);

    if (!updatedPassword) {
      res.status(404).json({
        success: false,
        message: 'Senha não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Senha atualizada com sucesso',
      data: updatedPassword
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
    const deleted = await passwordService.deletePassword(req.user.id, id, req);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Senha não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Senha deletada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.get('/generate', asAuthenticatedHandler(async (req, res) => {
  try {
    const queryParams = req.query;
    const options = {
      length: queryParams['length'] ? parseInt(queryParams['length'] as string) : 16,
      includeUppercase: queryParams['includeUppercase'] !== 'false',
      includeLowercase: queryParams['includeLowercase'] !== 'false',
      includeNumbers: queryParams['includeNumbers'] !== 'false',
      includeSymbols: queryParams['includeSymbols'] !== 'false',
    };

    const generatedPassword = await passwordService.generateSecurePassword(options);

    res.json({
      success: true,
      data: {
        password: generatedPassword.password,
        strength: generatedPassword.strength
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


export default router;
