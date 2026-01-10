import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PORT, CORS_ORIGIN, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, NODE_ENV } from './infrastructure/config';

const app = express();


app.use(helmet());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));


const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { 
    success: false, 
    message: 'Muitas tentativas. Tente novamente em 15 minutos.' 
  }
});
app.use(limiter);


app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});


import authRoutes from './controllers/auth/authController';
import passwordRoutes from './controllers/passwords/passwordController';
import userRoutes from './controllers/users/userController';
import totpRoutes from './controllers/totp/totpController';
import importExportRoutes from './controllers/importExport/importExportController';
import preferencesRoutes from './controllers/preferences/preferencesController';
import familyRoutes from './controllers/family/familyController';
import locationRoutes from './controllers/location/locationController';
import notificationRoutes from './controllers/notification/notificationController';
import geofenceRoutes from './controllers/geofence/geofenceController';
import secureNoteRoutes from './controllers/secureNotes/secureNoteController';
import calendarRoutes from './controllers/calendar/calendarController';
import contactRoutes from './controllers/contacts/contactController';

app.use('/api/auth', authRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/users', userRoutes);
app.use('/api/totp', totpRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/geofence', geofenceRoutes);
app.use('/api/secure-notes', secureNoteRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/contacts', contactRoutes);


app.use((_err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});


app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});


if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    const { CalendarService } = require('./services/calendar/calendarService');
    const calendarService = new CalendarService();
    
    calendarService.checkAndSendReminders().catch((err: Error) => {
      console.error('Erro ao verificar lembretes do calendário:', err);
    });
    
    setInterval(() => {
      calendarService.checkAndSendReminders().catch((err: Error) => {
        console.error('Erro ao verificar lembretes do calendário:', err);
      });
    }, 60 * 1000);
  });
}

export default app;
