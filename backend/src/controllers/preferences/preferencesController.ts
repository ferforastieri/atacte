import express from 'express';
import { PreferencesService } from '../../services/preferences/preferencesService';
import { authenticateToken } from '../../middleware/auth';
import { asAuthenticatedHandler } from '../../types/express';

const router = express.Router();
const preferencesService = new PreferencesService();


router.get('/', authenticateToken, asAuthenticatedHandler(async (req, res) => {
  try {
    const preferences = await preferencesService.getUserPreferences(req.user.id);
    
    if (!preferences) {
      res.status(404).json({
        success: false,
        message: 'Preferências não encontradas'
      });
      return;
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar preferências'
    });
  }
}));


router.post('/', authenticateToken, asAuthenticatedHandler(async (req, res) => {
  try {
    const { theme, language, autoLock } = req.body;
    
    const preferences = await preferencesService.createUserPreferences(req.user.id, {
      userId: req.user.id,
      theme,
      language,
      autoLock,
    });

    res.status(201).json({
      success: true,
      data: preferences,
      message: 'Preferências criadas com sucesso'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar preferências';
    res.status(400).json({
      success: false,
      message: 'Erro ao criar preferências',
      error: errorMessage
    });
  }
}));


router.put('/', authenticateToken, asAuthenticatedHandler(async (req, res) => {
  try {
    
    const { theme, language, autoLock } = req.body;
    
    
    const preferences = await preferencesService.updateUserPreferences(req.user.id, {
      theme,
      language,
      autoLock,
    });


    if (!preferences) {
      res.status(404).json({
        success: false,
        message: 'Preferências não encontradas'
      });
      return;
    }

    res.json({
      success: true,
      data: preferences,
      message: 'Preferências atualizadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar preferências';
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar preferências',
      error: errorMessage
    });
  }
}));


router.patch('/', authenticateToken, asAuthenticatedHandler(async (req, res) => {
  try {
    
    const { theme, language, autoLock } = req.body;
    
    
    const preferences = await preferencesService.upsertUserPreferences(req.user.id, {
      userId: req.user.id,
      theme,
      language,
      autoLock,
    });


    res.json({
      success: true,
      data: preferences,
      message: 'Preferências salvas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer upsert das preferências:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar preferências';
    res.status(400).json({
      success: false,
      message: 'Erro ao salvar preferências',
      error: errorMessage
    });
  }
}));


router.delete('/', authenticateToken, asAuthenticatedHandler(async (req, res) => {
  try {
    const deleted = await preferencesService.deleteUserPreferences(req.user.id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Preferências não encontradas'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Preferências deletadas com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar preferências'
    });
  }
}));

export default router;
