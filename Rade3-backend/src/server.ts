import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import usersRoutes from './routes/usersRoutes';
import sitesRoutes from './routes/sitesRoutes';
import classificationRoutes from './routes/classificationRoutes';
import simulatorRoutes from './routes/simulatorRoutes';
import { initDatabase } from './db/database';
import { seedIfEmpty, seedWadiAlAsfarEventsIfMissing } from './data/eventsRepository';
import { seedDefaultAdmin } from './data/usersRepository';
import { seedSitesIfEmpty, seedWadiAlAsfarSiteIfMissing } from './data/sitesRepository';
import { seedSensorsIfEmpty, seedWadiAlAsfarSensorsIfMissing } from './data/sensorsRepository';
import { seedZonesIfEmpty, seedWadiAlAsfarZoneIfMissing } from './data/zonesRepository';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS Configuration
// CORS_ORIGIN accepts a comma-separated list (e.g.
// "https://app.example.com,https://www.example.com") so production origins
// can be set purely via environment variable, without a code change per
// deploy. Falls back to the existing dev/legacy defaults if unset.
const DEFAULT_CORS_ORIGINS = [
  'https://radeae.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : DEFAULT_CORS_ORIGINS;

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// ✅ Logging Middleware
app.use((req, res, next) => {
  const isStreamRoute = req.path.endsWith('/stream');
  console.log(`📨 ${req.method} ${req.path}`, {
    query: isStreamRoute ? '[redacted]' : req.query,
    body: req.method === 'POST' ? req.body : undefined,
    origin: req.headers.origin
  });
  next();
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'النظام يعمل بشكل طبيعي ✅',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/sites', sitesRoutes);
// Proxies to the separate Python inference microservice (RadeaeAIModel/inference_api).
// Experimental model signal only — see classificationController.ts.
app.use('/api/v1/classification', classificationRoutes);
// Proxies to the separate Rade3-sensor-simulator service. Admin-only — see
// simulatorRoutes.ts.
app.use('/api/v1/simulator', simulatorRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'مرحباً بك في API نظام رادع الأمني',
    endpoints: {
      health: '/api/health',
      login: '/api/v1/auth/login',
      events: '/api/v1/sites/:siteId/events',
      statistics: '/api/v1/sites/:siteId/events/stats',
      eventById: '/api/v1/sites/:siteId/events/:id',
      users: '/api/v1/users',
      sites: '/api/v1/sites',
      classification: '/api/v1/classification/* (experimental, proxies Python inference service)',
      simulator: '/api/v1/simulator/* (admin only, proxies sensor simulator service)'
    },
    timestamp: new Date().toISOString()
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود ❌',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ خطأ في الخادم:', err);
  res.status(500).json({
    success: false,
    message: 'خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

const start = async () => {
  await initDatabase();
  seedSitesIfEmpty();
  seedSensorsIfEmpty();
  seedZonesIfEmpty();
  seedIfEmpty();
  seedDefaultAdmin();

  // Wadi Al Asfar: historical, experimental AI-model-classified seismic
  // events, seeded as a separate site (checked per-site, not gated by the
  // "if empty" seeders above, so this runs on an existing dev database too).
  seedWadiAlAsfarSiteIfMissing();
  seedWadiAlAsfarSensorsIfMissing();
  seedWadiAlAsfarZoneIfMissing();
  seedWadiAlAsfarEventsIfMissing();

  app.listen(PORT, () => {
    console.log('\n🚀 ═══════════════════════════════════════════════════');
    console.log(`   نظام رادع الأمني - Backend API`);
    console.log('   ═══════════════════════════════════════════════════');
    console.log(`   🌐 السيرفر يعمل على: http://localhost:${PORT}`);
    console.log(`   📡 البيئة: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   ✅ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`   📊 API Endpoints: http://localhost:${PORT}/api/v1/events`);
    console.log('   ═══════════════════════════════════════════════════\n');
  });
};

start();
