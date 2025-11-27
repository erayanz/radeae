import express, { Express, Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;
const BACKEND_URL = process.env.BACKEND_URL || 'https://radeae-production.up.railway.app/api/v1';

app.use(cors({
  origin: [
    'https://radeae.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
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

// Simulation State
let eventCount = 0;
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

const zones = ['بوابة الدخول الشمالية', 'بوابة الدخول الجنوبية', 'روضة التنهات', 'روضة الخفس', 'الزاوية الشمالية الغربية'];
const eventTypes = ['vehicle', 'human', 'animal', 'noise'];
const riskLevels = ['low', 'medium', 'high'];
const sensorIds = ['SENSOR_001', 'SENSOR_002', 'SENSOR_003', 'SENSOR_004', 'SENSOR_005'];

function generateEvent() {
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
  
  return {
    eventType,
    latitude: 25.1 + Math.random() * 2.3,
    longitude: 45.3 + Math.random() * 1.7,
    riskLevel,
    description: `كشف ${eventType === 'vehicle' ? 'مركبة' : eventType === 'human' ? 'إنسان' : eventType === 'animal' ? 'حيوان' : 'ضوضاء'}`,
    zone: zones[Math.floor(Math.random() * zones.length)],
    sensorId: sensorIds[Math.floor(Math.random() * sensorIds.length)],
    suggestedAction: riskLevel === 'high' ? 'إرسال دورية فوراً' : riskLevel === 'medium' ? 'تنبيه الدوريات' : 'مراقبة مستمرة'
  };
}

async function sendEvent() {
  try {
    const event = generateEvent();
    
    const response = await axios.post(`${BACKEND_URL}/events`, event, {
      timeout: 5000
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
    
    const event = {
      eventType: eventType || eventTypes[Math.floor(Math.random() * eventTypes.length)],
      latitude: 25.1 + Math.random() * 2.3,
      longitude: 45.3 + Math.random() * 1.7,
      riskLevel: riskLevel || riskLevels[Math.floor(Math.random() * riskLevels.length)],
      description: `حدث يدوي - ${eventType}`,
      zone: zones[Math.floor(Math.random() * zones.length)],
      sensorId: sensorIds[Math.floor(Math.random() * sensorIds.length)],
      suggestedAction: 'تم التوليد يدوياً'
    };
    
    await axios.post(`${BACKEND_URL}/events`, event);
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
