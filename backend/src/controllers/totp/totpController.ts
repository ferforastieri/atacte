import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../../middleware/auth';
import { asAuthenticatedHandler } from '../../types/express';
import { TOTPService } from '../../services/totp/totpService';

const router = Router();
const totpService = new TOTPService();


router.use(authenticateToken);


router.post('/generate', [
  body('serviceName')
    .notEmpty()
    .withMessage('Nome do serviço é obrigatório'),
  body('accountName')
    .notEmpty()
    .withMessage('Nome da conta é obrigatório')
], asAuthenticatedHandler(async (req, res) => {
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

    const { serviceName, accountName } = req.body;
    const totpData = TOTPService.generateSecret(serviceName, accountName);

    res.json({
      success: true,
      data: {
        secret: totpData.secret,
        manualEntryKey: totpData.manualEntryKey,
        qrCodeUrl: totpData.qrCodeUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.post('/qrcode', [
  body('otpauthUrl')
    .notEmpty()
    .withMessage('URL otpauth é obrigatória')
    .matches(/^otpauth:\/\/totp\/.*$/)
    .withMessage('URL otpauth inválida')
], asAuthenticatedHandler(async (req, res) => {
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

    const { otpauthUrl } = req.body;
    const qrCodeDataUrl = await TOTPService.generateQRCode(otpauthUrl);

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.post('/validate', [
  body('secret')
    .notEmpty()
    .withMessage('Secret TOTP é obrigatório'),
  body('code')
    .notEmpty()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Código deve ter 6 dígitos numéricos')
], asAuthenticatedHandler(async (req, res) => {
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

    const { secret, code } = req.body;
    
    
    if (!TOTPService.isValidSecret(secret)) {
      res.status(400).json({
        success: false,
        message: 'Secret TOTP inválido'
      });
      return;
    }

    const validation = TOTPService.validateCode(secret, code);

    res.json({
      success: true,
      data: {
        isValid: validation.isValid,
        delta: validation.delta
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.post('/parse', [
  body('otpauthUrl')
    .notEmpty()
    .withMessage('URL otpauth é obrigatória')
], asAuthenticatedHandler(async (req, res) => {
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

    const { otpauthUrl } = req.body;
    const parsed = TOTPService.parseOtpAuthUrl(otpauthUrl);

    if (!parsed) {
      res.status(400).json({
        success: false,
        message: 'URL otpauth inválida'
      });
      return;
    }

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.post('/test', [
  body('secret')
    .notEmpty()
    .withMessage('Secret TOTP é obrigatório')
], asAuthenticatedHandler(async (req, res) => {
  try {
    
    if (process.env['NODE_ENV'] === 'production') {
      res.status(403).json({
        success: false,
        message: 'Endpoint não disponível em produção'
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
      return;
    }

    const { secret } = req.body;
    
    if (!TOTPService.isValidSecret(secret)) {
      res.status(400).json({
        success: false,
        message: 'Secret TOTP inválido'
      });
      return;
    }

    const codes = TOTPService.generateMultipleCodes(secret);

    res.json({
      success: true,
      data: {
        previous: TOTPService.formatCode(codes.previous),
        current: TOTPService.formatCode(codes.current),
        next: TOTPService.formatCode(codes.next),
        timeRemaining: codes.timeRemaining
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}));


router.get('/passwords/:id', asAuthenticatedHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID é obrigatório',
      });
      return;
    }
    const totpCode = await totpService.getTotpCodeForEntry(req.user.id, id);

    if (!totpCode) {
      res.status(404).json({
        success: false,
        message: 'TOTP não encontrado ou não habilitado para esta entrada'
      });
      return;
    }

    res.json({
      success: true,
      data: totpCode
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}));


router.get('/passwords/:id/secret', asAuthenticatedHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID é obrigatório',
      });
      return;
    }
    const totpSecret = await totpService.getTotpSecretForEntry(req.user.id, id);

    if (!totpSecret) {
      res.status(404).json({
        success: false,
        message: 'Secret TOTP não encontrado ou não habilitado para esta entrada'
      });
      return;
    }

    res.json({
      success: true,
      data: totpSecret
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}));


router.post('/passwords/:id', [
  body('totpInput')
    .notEmpty()
    .withMessage('Chave TOTP ou URL otpauth é obrigatória')
], asAuthenticatedHandler(async (req, res) => {
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
    const { totpInput } = req.body;

    const result = await totpService.addTotpToEntry(
      req.user.id, 
      id, 
      totpInput, 
      req
    );

    res.json({
      success: true,
      message: 'TOTP adicionado com sucesso',
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    if (errorMessage === 'Secret TOTP inválido') {
      res.status(400).json({
        success: false,
        message: errorMessage
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}));


router.delete('/passwords/:id', asAuthenticatedHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID é obrigatório',
      });
      return;
    }
    const result = await totpService.removeTotpFromEntry(req.user.id, id, req);

    res.json({
      success: true,
      message: 'TOTP removido com sucesso',
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}));

export default router;
