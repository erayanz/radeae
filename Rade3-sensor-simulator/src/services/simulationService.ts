import axios from 'axios';
import { EventGenerator } from '../utils/eventGenerator';
import { SimulationState } from '../types/sensor';
import { SENSORS } from '../data/sensors';

export class SimulationService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private totalEventsGenerated = 0;
  private lastEventTime: string | null = null;
  private readonly backendUrl = process.env.BACKEND_API || 'https://radeae-production.up.railway.app/api/v1';
  private readonly interval = parseInt(process.env.SIMULATION_INTERVAL || '10000');
  
  start() {
    if (this.isRunning) {
      console.log('⚠️ المحاكاة قيد التشغيل بالفعل');
      return;
    }
    
    this.isRunning = true;
    console.log('🚀 بدء المحاكاة...');
    
    this.generateAndSendEvent();
    
    this.intervalId = setInterval(() => {
      this.generateAndSendEvent();
    }, this.interval);
  }
  
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ المحاكاة متوقفة بالفعل');
      return;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.isRunning = false;
    console.log('⏹️ تم إيقاف المحاكاة');
  }
  
  private async generateAndSendEvent() {
    try {
      const event = EventGenerator.generateRandomEvent();
      
      await axios.post(`${this.backendUrl}/events`, {
        id: `event_${Date.now()}`,
        timestamp: event.timestamp,
        sensorId: event.sensorId,
        eventType: event.eventType,
        riskLevel: event.riskLevel,
        latitude: event.latitude,
        longitude: event.longitude,
        zone: event.zone,
        description: event.description,
        suggestedAction: this.getSuggestedAction(event.eventType, event.riskLevel)
      });
      
      this.totalEventsGenerated++;
      this.lastEventTime = event.timestamp;
      
      console.log(`✅ تم إرسال حدث: ${event.eventType} (${event.riskLevel}) من ${event.sensorId}`);
    } catch (error) {
      console.error('❌ خطأ في إرسال الحدث:', error);
    }
  }
  
  async sendSpecificEvent(
    eventType: 'human' | 'vehicle' | 'animal' | 'noise',
    riskLevel: 'low' | 'medium' | 'high',
    sensorId?: string
  ) {
    try {
      const event = EventGenerator.generateSpecificEvent(eventType, riskLevel, sensorId);
      
      await axios.post(`${this.backendUrl}/events`, {
        id: `event_${Date.now()}`,
        timestamp: event.timestamp,
        sensorId: event.sensorId,
        eventType: event.eventType,
        riskLevel: event.riskLevel,
        latitude: event.latitude,
        longitude: event.longitude,
        zone: event.zone,
        description: event.description,
        suggestedAction: this.getSuggestedAction(event.eventType, event.riskLevel)
      });
      
      this.totalEventsGenerated++;
      this.lastEventTime = event.timestamp;
      
      console.log(`✅ تم إرسال حدث محدد: ${event.eventType}`);
      return event;
    } catch (error) {
      console.error('❌ خطأ في إرسال الحدث المحدد:', error);
      throw error;
    }
  }
  
  private getSuggestedAction(eventType: string, riskLevel: string): string {
    if (riskLevel === 'high') {
      return 'إرسال دورية أمنية فوراً + تفعيل الكاميرات';
    } else if (riskLevel === 'medium') {
      return 'تنبيه الدوريات القريبة + توجيه الكاميرا';
    } else {
      return 'مراقبة مستمرة فقط';
    }
  }
  
  getState(): SimulationState {
    return {
      isRunning: this.isRunning,
      totalEventsGenerated: this.totalEventsGenerated,
      lastEventTime: this.lastEventTime,
      sensors: SENSORS
    };
  }
}
