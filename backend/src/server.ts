import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PORT, CORS_ORIGIN, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, NODE_ENV, TRUST_PROXY, BUILD_VERSION } from './infrastructure/config';
import { csrfProtection } from './middleware/csrf';
import { mutationLimiter } from './middleware/auth';

const app = express();

app.set('trust proxy', TRUST_PROXY);
const allowedOrigins = new Set(CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean));

// Requests routed through the same public origin do not need CORS negotiation.
// Strip their Origin before cors() while preserving cross-origin checks.
app.use((req, _res, next) => {
  const origin = req.get('Origin');
  if (origin && origin === `${req.protocol}://${req.get('host')}`) {
    delete req.headers.origin;
  }
  next();
});

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origem não permitida'));
  },
  credentials: true
}));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));


const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { 
    success: false, 
    message: 'Muitas tentativas. Tente novamente em 15 minutos.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/health'
});
app.use(limiter);
app.use('/api', csrfProtection);
app.use('/api', mutationLimiter);


app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ 
    success: true,
    message: 'Servidor disponível',
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: BUILD_VERSION
  });
});

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});


import authRoutes from './controllers/auth/authController';
import passwordRoutes from './controllers/passwords/passwordController';
import userRoutes from './controllers/users/userController';
import totpRoutes from './controllers/totp/totpController';
import importExportRoutes from './controllers/importExport/importExportController';
import preferencesRoutes from './controllers/preferences/preferencesController';
import secureNoteRoutes from './controllers/secureNotes/secureNoteController';
import systemRoutes from './controllers/system/systemController';

app.use('/api/auth', authRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/users', userRoutes);
app.use('/api/totp', totpRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/secure-notes', secureNoteRoutes);
app.use('/api', systemRoutes);


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
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export default app;
