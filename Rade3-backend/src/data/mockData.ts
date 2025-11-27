import { Event } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const generateMockEvents = (): Event[] => {
  const events: Event[] = [];

  const eventConfigs = [
    {
      sensorId: 'SENSOR_001',
      eventType: 'vehicle' as const,
      riskLevel: 'high' as const,
      zone: 'بوابة الدخول الشمالية',
      description: 'مركبة غير مصرح بها قرب المدخل الشمالي',
      baseCoords: { lat: 25.9000, lng: 45.6500 }
    },
    {
      sensorId: 'SENSOR_003',
      eventType: 'animal' as const,
      riskLevel: 'low' as const,
      zone: 'روضة التنهات',
      description: 'غزال عربي في المنطقة المحمية',
      baseCoords: { lat: 25.8389, lng: 45.6667 }
    },
    {
      sensorId: 'SENSOR_004',
      eventType: 'human' as const,
      riskLevel: 'medium' as const,
      zone: 'روضة الخفس',
      description: 'حركة إنسان مريبة في روضة الخفس',
      baseCoords: { lat: 25.8000, lng: 45.7000 }
    },
    {
      sensorId: 'SENSOR_002',
      eventType: 'noise' as const,
      riskLevel: 'low' as const,
      zone: 'بوابة الدخول الجنوبية',
      description: 'ضوضاء طبيعية - حيوانات برية',
      baseCoords: { lat: 25.7500, lng: 45.6500 }
    },
    {
      sensorId: 'SENSOR_005',
      eventType: 'vehicle' as const,
      riskLevel: 'high' as const,
      zone: 'الزاوية الشمالية الغربية',
      description: 'محاولة دخول غير مصرح بها',
      baseCoords: { lat: 25.9000, lng: 45.5500 }
    },
    {
      sensorId: 'SENSOR_006',
      eventType: 'animal' as const,
      riskLevel: 'low' as const,
      zone: 'الزاوية الشمالية الشرقية',
      description: 'نعام في موطنها الطبيعي',
      baseCoords: { lat: 25.9000, lng: 45.7500 }
    }
  ];

  eventConfigs.forEach((config, index) => {
    for (let i = 0; i < 3; i++) {
      const timestamp = new Date(Date.now() - (index * 5 + i) * 60 * 1000);
      
      events.push({
        id: uuidv4(),
        timestamp: timestamp.toISOString(),
        sensorId: config.sensorId,
        eventType: config.eventType,
        riskLevel: config.riskLevel,
        latitude: config.baseCoords.lat + (Math.random() - 0.5) * 0.01,
        longitude: config.baseCoords.lng + (Math.random() - 0.5) * 0.01,
        zone: config.zone,
        description: config.description,
        suggestedAction: getSuggestedAction(config.riskLevel)
      });
    }
  });

  return events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

function getSuggestedAction(riskLevel: string): string {
  if (riskLevel === 'high') {
    return 'إرسال دورية أمنية فوراً + تفعيل الكاميرات';
  } else if (riskLevel === 'medium') {
    return 'تنبيه الدوريات القريبة + توجيه الكاميرا';
  } else {
    return 'مراقبة مستمرة فقط';
  }
}

let events: Event[] = generateMockEvents();

export const getEvents = (): Event[] => {
  console.log('📋 mockData - getEvents called, total:', events.length);
  return events;
};

export const addEvent = (event: Event): Event => {
  if (!event.id) {
    event.id = uuidv4();
  }
  
  // ✅ تأكد من وجود timestamp
  if (!event.timestamp) {
    event.timestamp = new Date().toISOString();
  }
  
  events.unshift(event);
  
  // ✅ لا نحذف الأحداث القديمة - نحتفظ بكل شيء
  // if (events.length > 100) {
  //   events = events.slice(0, 100);
  // }
  
  console.log('✅ mockData - Event added:', {
    id: event.id,
    type: event.eventType,
    risk: event.riskLevel,
    totalNow: events.length
  });
  
  return event;
};

export const resetEvents = (): void => {
  events = generateMockEvents();
  console.log('🔄 mockData - Events reset, total:', events.length);
};

export { events };
