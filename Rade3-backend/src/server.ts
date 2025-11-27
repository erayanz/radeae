import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventsRoutes from './routes/eventsRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS Configuration - محدّث لدعم Vercel
app.use(cors({
  origin: [
    'https://radeae.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// ✅ Logging Middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, {
    query: req.query,
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

app.use('/api/v1/events', eventsRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'مرحباً بك في API نظام رادع الأمني',
    endpoints: {
      health: '/api/health',
      events: '/api/v1/events',
      statistics: '/api/v1/events/stats',
      eventById: '/api/v1/events/:id'
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
