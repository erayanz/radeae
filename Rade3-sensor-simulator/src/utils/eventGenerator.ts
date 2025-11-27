import { SensorEvent } from '../types/sensor';
import { SENSORS, EVENT_TYPES, EVENT_DESCRIPTIONS } from '../data/sensors';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api/v1';
const RISK_LEVELS: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

function getSuggestedAction(riskLevel: string): string {
  if (riskLevel === 'high') {
    return 'إرسال دورية أمنية فوراً + تفعيل الكاميرات';
  } else if (riskLevel === 'medium') {
    return 'تنبيه الدوريات القريبة + توجيه الكاميرا';
  } else {
    return 'مراقبة مستمرة فقط';
  }
}

export class EventGenerator {
  static generateRandomEvent(): SensorEvent {
    const sensor = SENSORS[Math.floor(Math.random() * SENSORS.length)];
    const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    
    let riskLevel: 'low' | 'medium' | 'high';
    const rand = Math.random();
    
    if (eventType === 'vehicle') {
      riskLevel = rand < 0.6 ? 'high' : rand < 0.8 ? 'medium' : 'low';
    } else if (eventType === 'human') {
      riskLevel = rand < 0.5 ? 'medium' : rand < 0.8 ? 'low' : 'high';
    } else if (eventType === 'animal') {
      riskLevel = rand < 0.7 ? 'low' : 'medium';
    } else {
      riskLevel = rand < 0.8 ? 'low' : 'medium';
    }
    
    return {
      sensorId: sensor.id,
      eventType,
      riskLevel,
      timestamp: new Date().toISOString(),
      latitude: sensor.latitude + (Math.random() - 0.5) * 0.01,
      longitude: sensor.longitude + (Math.random() - 0.5) * 0.01,
      zone: sensor.zone,
      description: EVENT_DESCRIPTIONS[eventType]
    };
  }
  
  static generateSpecificEvent(
    eventType: 'human' | 'vehicle' | 'animal' | 'noise',
    riskLevel: 'low' | 'medium' | 'high',
    sensorId?: string
  ): SensorEvent {
    const sensor = sensorId 
      ? SENSORS.find(s => s.id === sensorId) || SENSORS[0]
      : SENSORS[Math.floor(Math.random() * SENSORS.length)];
    
    return {
      sensorId: sensor.id,
      eventType,
      riskLevel,
      timestamp: new Date().toISOString(),
      latitude: sensor.latitude + (Math.random() - 0.5) * 0.01,
      longitude: sensor.longitude + (Math.random() - 0.5) * 0.01,
      zone: sensor.zone,
      description: EVENT_DESCRIPTIONS[eventType]
    };
  }

  static async generateRandomEventWithBackend(): Promise<void> {
    const sensor = SENSORS[Math.floor(Math.random() * SENSORS.length)];
    const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const riskLevel = RISK_LEVELS[Math.floor(Math.random() * RISK_LEVELS.length)];

    const event = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      sensorId: sensor.id,
      eventType,
      riskLevel,
      latitude: sensor.latitude + (Math.random() - 0.5) * 0.01,
      longitude: sensor.longitude + (Math.random() - 0.5) * 0.01,
      zone: sensor.zone,
      description: EVENT_DESCRIPTIONS[eventType] || 'حدث غير معروف',
      suggestedAction: getSuggestedAction(riskLevel)
    };

    try {
      console.log('📤 Simulator - Sending event to backend:', {
        id: event.id,
        type: event.eventType,
        risk: event.riskLevel
      });
      
      await axios.post(`${BACKEND_URL}/events`, event);
      
      console.log('✅ Simulator - Event sent successfully');
    } catch (error) {
      console.error('❌ Simulator - Failed to send event:', error);
    }
  }
}
