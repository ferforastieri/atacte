import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { GeofenceService } from '../../services/geofence/geofenceService';
import { UpdateGeofenceZoneData } from '../../repositories/geofence/geofenceRepository';
import { asAuthenticatedHandler } from '../../types/express';

const router = Router();
const geofenceService = new GeofenceService();

// POST /api/geofence/zones
router.post('/zones', authenticateToken, asAuthenticatedHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { familyId, name, description, latitude, longitude, radius, notifyOnEnter, notifyOnExit } = req.body;

    // Validações
    if (!familyId || !name || !latitude || !longitude || !radius) {
      res.status(400).json({
        success: false,
        message: 'FamilyId, nome, latitude, longitude e raio são obrigatórios',
      });
      return;
    }

    if (radius < 50 || radius > 10000) {
      res.status(400).json({
        success: false,
        message: 'O raio deve estar entre 50 e 10000 metros',
      });
      return;
    }

    const zone = await geofenceService.createZone(
      userId,
      familyId,
      {
        name,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseFloat(radius),
        notifyOnEnter,
        notifyOnExit,
      },
      req
    );

    res.status(201).json({
      success: true,
      data: zone,
    });
  } catch (error) {
    console.error('Erro ao criar zona:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar zona';
    const statusCode = errorMessage.includes('permissão') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
}));

// GET /api/geofence/zones
router.get('/zones', authenticateToken, asAuthenticatedHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { familyId, active } = req.query;

    let zones;
    if (familyId) {
      // Buscar zonas de uma família específica
      zones = active === 'true'
        ? await geofenceService.getActiveFamilyZones(userId, familyId as string)
        : await geofenceService.getFamilyZones(userId, familyId as string);
    } else {
      // Buscar todas as zonas ativas das famílias do usuário
      zones = await geofenceService.getActiveUserZones(userId);
    }

    res.json({
      success: true,
      data: zones,
    });
  } catch (error) {
    console.error('Erro ao buscar zonas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar zonas';
    const statusCode = errorMessage.includes('permissão') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
}));

// PATCH /api/geofence/zones/:id
router.patch('/zones/:id', authenticateToken, asAuthenticatedHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, latitude, longitude, radius, isActive, notifyOnEnter, notifyOnExit } = req.body;

    const updateData: Partial<UpdateGeofenceZoneData> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (radius !== undefined) {
      const radiusValue = parseFloat(radius);
      if (radiusValue < 50 || radiusValue > 10000) {
        res.status(400).json({
          success: false,
          message: 'O raio deve estar entre 50 e 10000 metros',
        });
        return;
      }
      updateData.radius = radiusValue;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notifyOnEnter !== undefined) updateData.notifyOnEnter = notifyOnEnter;
    if (notifyOnExit !== undefined) updateData.notifyOnExit = notifyOnExit;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID da zona é obrigatório',
      });
      return;
    }
    const zone = await geofenceService.updateZone(userId, id, updateData, req);

    res.json({
      success: true,
      data: zone,
    });
  } catch (error) {
    console.error('Erro ao atualizar zona:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar zona';
    res.status(errorMessage.includes('permissão') ? 403 : 500).json({
      success: false,
      message: errorMessage,
    });
  }
}));

// DELETE /api/geofence/zones/:id
router.delete('/zones/:id', authenticateToken, asAuthenticatedHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID da zona é obrigatório',
      });
      return;
    }

    await geofenceService.deleteZone(userId, id, req);

    res.json({
      success: true,
      message: 'Zona deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar zona:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar zona';
    res.status(errorMessage.includes('permissão') ? 403 : 500).json({
      success: false,
      message: errorMessage,
    });
  }
}));

// POST /api/geofence/check
router.post('/check', authenticateToken, asAuthenticatedHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        message: 'Latitude e longitude são obrigatórias',
      });
      return;
    }

    const zonesInRange = await geofenceService.checkLocationInZones(
      userId,
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.json({
      success: true,
      data: {
        inZones: zonesInRange.length > 0,
        zones: zonesInRange,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar localização:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar localização';
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}));

export default router;
