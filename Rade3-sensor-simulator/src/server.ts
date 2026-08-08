import express, { Express, Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;
const BACKEND_URL = process.env.BACKEND_URL || 'https://radeae-production.up.railway.app/api/v1';
const SENSOR_API_KEY = process.env.SENSOR_API_KEY || '';
const SITE_ID = process.env.SITE_ID;
const backendHeaders = { 'x-api-key': SENSOR_API_KEY };

// Same CORS_ORIGIN env-var pattern as Rade3-backend/src/server.ts -- this
// service's own endpoints are no longer called directly from the browser
// (the dashboard now proxies simulator control through the backend, see
// Rade3-backend/src/controllers/simulatorController.ts), but this stays
// configurable for direct/manual testing against it.
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

console.log('\n🎮 ═══════════════════════════════════════════════════');
console.log('   محاكي المجسات - Sensor Simulator');
console.log('═══════════════════════════════════════════════════');
console.log(`🌐 يعمل على: http://localhost:${PORT}`);
console.log(`📡 Backend URL: ${BACKEND_URL}`);
console.log('═══════════════════════════════════════════════════\n');

if (!SITE_ID) {
  console.error('❌ SITE_ID غير معرّف في .env — لا يمكن تشغيل المحاكي بدون تحديد الموقع');
  process.exit(1);
}

// Simulation State
let eventCount = 0;
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

const eventTypes = ['vehicle', 'human', 'animal', 'noise'];
const riskLevels = ['low', 'medium', 'high'];

let cachedSensorLabels: string[] = [];
let cachedZoneNames: string[] = [];

async function loadSiteData(): Promise<void> {
  try {
    const [sensorsRes, zonesRes] = await Promise.all([
      axios.get(`${BACKEND_URL}/sites/${SITE_ID}/sensors`, { headers: backendHeaders, timeout: 5000 }),
      axios.get(`${BACKEND_URL}/sites/${SITE_ID}/zones`, { headers: backendHeaders, timeout: 5000 })
    ]);
    cachedSensorLabels = (sensorsRes.data.data as { sensorLabel: string }[]).map(s => s.sensorLabel);
    cachedZoneNames = (zonesRes.data.data as { name: string }[]).map(z => z.name);
    console.log(`✅ تم تحميل بيانات الموقع: ${cachedSensorLabels.length} مجس، ${cachedZoneNames.length} منطقة`);
  } catch (error: any) {
    console.error('❌ فشل تحميل بيانات المجسات/المناطق:', error.message);
    throw error;
  }
}

// Retries loadSiteData with backoff. Needed because `npm run dev` boots the
// backend and simulator concurrently -- the simulator can (and does, in
// practice) reach out before the backend has finished starting, and without
// a retry here cachedSensorLabels/cachedZoneNames stay empty forever, which
// silently no-ops every future event (generateEvent returns null, and
// trigger-event returns 503) with no further log output to explain why.
async function loadSiteDataWithRetry(maxAttempts = 10, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await loadSiteData();
      return;
    } catch {
      if (attempt === maxAttempts) {
        console.error(`❌ فشل تحميل بيانات الموقع بعد ${maxAttempts} محاولات — سيتم إعادة المحاولة عند أول طلب`);
        return;
      }
      console.warn(`⏳ إعادة محاولة تحميل بيانات الموقع (${attempt}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

function generateEvent() {
  if (cachedSensorLabels.length === 0 || cachedZoneNames.length === 0) {
    return null;
  }
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

  return {
    eventType,
    latitude: 25.1 + Math.random() * 2.3,
    longitude: 45.3 + Math.random() * 1.7,
    riskLevel,
    description: `كشف ${eventType === 'vehicle' ? 'مركبة' : eventType === 'human' ? 'إنسان' : eventType === 'animal' ? 'حيوان' : 'ضوضاء'}`,
    zone: cachedZoneNames[Math.floor(Math.random() * cachedZoneNames.length)],
    sensorId: cachedSensorLabels[Math.floor(Math.random() * cachedSensorLabels.length)],
    suggestedAction: riskLevel === 'high' ? 'إرسال دورية فوراً' : riskLevel === 'medium' ? 'تنبيه الدوريات' : 'مراقبة مستمرة'
  };
}

async function sendEvent() {
  try {
    let event = generateEvent();
    if (!event) {
      console.warn('⚠️ لا توجد بيانات مجسات/مناطق محملة بعد، إعادة المحاولة...');
      await loadSiteData().catch(() => {});
      event = generateEvent();
      if (!event) {
        console.warn('⚠️ ما زالت بيانات المجسات/المناطق غير متاحة، تخطي الحدث');
        return;
      }
    }

    const response = await axios.post(`${BACKEND_URL}/sites/${SITE_ID}/events`, event, {
      timeout: 5000,
      headers: backendHeaders
    });

    eventCount++;
    console.log(`✅ Event #${eventCount} sent: ${event.eventType} at ${event.zone}`);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error sending event:', error.message);
  }
}

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'نظام المحاكاة يعمل بشكل طبيعي ✅',
    data: {
      status: isRunning ? 'running' : 'stopped',
      eventsSent: eventCount,
      backendURL: BACKEND_URL,
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  });
});

// Get Simulator State
app.get('/api/simulator/state', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      isRunning,
      totalEventsGenerated: eventCount,
      lastEventTime: new Date().toISOString(),
      backendURL: BACKEND_URL
    }
  });
});

// Start Simulator
app.post('/api/simulator/start', (req: Request, res: Response) => {
  if (isRunning) {
    return res.json({ 
      success: false, 
      message: 'المحاكاة تعمل بالفعل' 
    });
  }
  
  isRunning = true;
  
  intervalId = setInterval(async () => {
    if (!isRunning) {
      if (intervalId) clearInterval(intervalId);
      return;
    }
    await sendEvent();
  }, 3000);
  
  console.log('🚀 Simulator started');
  res.json({ 
    success: true, 
    message: 'تم بدء المحاكاة بنجاح',
    data: { status: 'running' }
  });
});

// Stop Simulator
app.post('/api/simulator/stop', (req: Request, res: Response) => {
  isRunning = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  console.log('🛑 Simulator stopped');
  res.json({ 
    success: true, 
    message: 'تم إيقاف المحاكاة',
    data: { status: 'stopped', totalEvents: eventCount }
  });
});

// Trigger Single Event
app.post('/api/simulator/trigger-event', async (req: Request, res: Response) => {
  try {
    const { eventType, riskLevel } = req.body;

    if (cachedSensorLabels.length === 0 || cachedZoneNames.length === 0) {
      await loadSiteData().catch(() => {});
    }
    if (cachedSensorLabels.length === 0 || cachedZoneNames.length === 0) {
      res.status(503).json({ success: false, message: 'بيانات المجسات لم يتم تحميلها بعد' });
      return;
    }

    const event = {
      eventType: eventType || eventTypes[Math.floor(Math.random() * eventTypes.length)],
      latitude: 25.1 + Math.random() * 2.3,
      longitude: 45.3 + Math.random() * 1.7,
      riskLevel: riskLevel || riskLevels[Math.floor(Math.random() * riskLevels.length)],
      description: `حدث يدوي - ${eventType}`,
      zone: cachedZoneNames[Math.floor(Math.random() * cachedZoneNames.length)],
      sensorId: cachedSensorLabels[Math.floor(Math.random() * cachedSensorLabels.length)],
      suggestedAction: 'تم التوليد يدوياً'
    };

    await axios.post(`${BACKEND_URL}/sites/${SITE_ID}/events`, event, { headers: backendHeaders });
    eventCount++;
    
    res.json({
      success: true,
      message: 'تم إرسال الحدث بنجاح',
      data: event
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'فشل إرسال الحدث',
      error: error.message
    });
  }
});

async function main(): Promise<void> {
  await loadSiteDataWithRetry();

  // Auto-start in production
  if (process.env.NODE_ENV === 'production') {
    isRunning = true;

    intervalId = setInterval(async () => {
      if (isRunning) {
        await sendEvent();
      }
    }, 3000);

    console.log('🚀 Auto-started in production mode');
  }

  app.listen(PORT, () => {
    console.log(`\n✅ Health Check: http://localhost:${PORT}/health`);
    console.log(`✅ Simulator State: http://localhost:${PORT}/api/simulator/state`);
    console.log(`✅ Start: POST http://localhost:${PORT}/api/simulator/start`);
    console.log(`✅ Stop: POST http://localhost:${PORT}/api/simulator/stop\n`);
  });
}

main();
