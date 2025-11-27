import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import simulatorRoutes from './routes/simulatorRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'نظام المحاكاة يعمل بشكل طبيعي ✅',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/simulator', simulatorRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود ❌',
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
  console.log('\n🎮 ═══════════════════════════════════════════════════');
  console.log(`   محاكي المجسات - Sensor Simulator`);
  console.log('   ═══════════════════════════════════════════════════');
  console.log(`   🌐 يعمل على: http://localhost:${PORT}`);
  console.log(`   📡 البيئة: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   ✅ Health Check: http://localhost:${PORT}/health`);
  console.log(`   🎮 التحكم: http://localhost:${PORT}/api/simulator/state`);
  console.log('   ═══════════════════════════════════════════════════\n');
});
