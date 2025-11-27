import { Event, SensorLocation, Statistics } from '../types';

export const mockEvents: Event[] = [
  {
    id: '1',
    timestamp: '2025-01-15T22:45:00',
    sensorId: 'SENSOR_001',
    eventType: 'vehicle',
    riskLevel: 'high',
    latitude: 24.7136,
    longitude: 46.6753,
    zone: 'حدود المحمية الجنوبية',
    suggestedAction: 'إرسال دورية أمنية فوراً + توجيه كاميرا المراقبة',
    description: 'اكتشاف حركة مركبة في منطقة محظورة ليلاً'
  },
  {
    id: '2',
    timestamp: '2025-01-15T21:30:00',
    sensorId: 'SENSOR_003',
    eventType: 'human',
    riskLevel: 'high',
    latitude: 24.7245,
    longitude: 46.6820,
    zone: 'البوابة الشرقية',
    suggestedAction: 'تنبيه فريق الأمن + التحقق من الهوية',
    description: 'رصد حركة أشخاص خارج أوقات العمل الرسمية'
  },
  {
    id: '3',
    timestamp: '2025-01-15T20:15:00',
    sensorId: 'SENSOR_007',
    eventType: 'animal',
    riskLevel: 'low',
    latitude: 24.7189,
    longitude: 46.6698,
    zone: 'المنطقة الغربية - قطاع A',
    suggestedAction: 'مراقبة فقط - حركة طبيعية',
    description: 'رصد حركة حيوانات برية في منطقة آمنة'
  },
  {
    id: '4',
    timestamp: '2025-01-15T19:45:00',
    sensorId: 'SENSOR_002',
    eventType: 'noise',
    riskLevel: 'medium',
    latitude: 24.7205,
    longitude: 46.6780,
    zone: 'محيط السياج الشمالي',
    suggestedAction: 'فحص المنطقة + تفعيل الإنارة',
    description: 'اكتشاف أصوات غير اعتيادية قرب نقطة التفتيش'
  },
  {
    id: '5',
    timestamp: '2025-01-15T18:20:00',
    sensorId: 'SENSOR_005',
    eventType: 'vehicle',
    riskLevel: 'medium',
    latitude: 24.7167,
    longitude: 46.6725,
    zone: 'الطريق الرئيسي',
    suggestedAction: 'التحقق من التصريح + تسجيل البيانات',
    description: 'مركبة متوقفة لفترة طويلة في منطقة غير مخصصة'
  },
  {
    id: '6',
    timestamp: '2025-01-15T17:00:00',
    sensorId: 'SENSOR_004',
    eventType: 'human',
    riskLevel: 'low',
    latitude: 24.7223,
    longitude: 46.6790,
    zone: 'منطقة الخدمات',
    suggestedAction: 'متابعة روتينية',
    description: 'حركة عمال الصيانة في الوقت المحدد'
  },
  {
    id: '7',
    timestamp: '2025-01-15T16:30:00',
    sensorId: 'SENSOR_006',
    eventType: 'animal',
    riskLevel: 'low',
    latitude: 24.7178,
    longitude: 46.6710,
    zone: 'المحمية الطبيعية - قطاع B',
    suggestedAction: 'لا يوجد - نشاط طبيعي',
    description: 'قطيع غزلان في موطنها الطبيعي'
  },
  {
    id: '8',
    timestamp: '2025-01-15T15:45:00',
    sensorId: 'SENSOR_008',
    eventType: 'noise',
    riskLevel: 'low',
    latitude: 24.7198,
    longitude: 46.6765,
    zone: 'قرب محطة الطاقة',
    suggestedAction: 'لا يوجد - أصوات تشغيلية',
    description: 'أصوات المولدات الكهربائية - نشاط عادي'
  },
  {
    id: '9',
    timestamp: '2025-01-15T14:20:00',
    sensorId: 'SENSOR_001',
    eventType: 'vehicle',
    riskLevel: 'low',
    latitude: 24.7140,
    longitude: 46.6755,
    zone: 'بوابة الدخول الرئيسية',
    suggestedAction: 'تم التحقق - مصرح',
    description: 'دخول مركبة رسمية بتصريح ساري'
  },
  {
    id: '10',
    timestamp: '2025-01-15T13:00:00',
    sensorId: 'SENSOR_009',
    eventType: 'human',
    riskLevel: 'medium',
    latitude: 24.7212,
    longitude: 46.6742,
    zone: 'منطقة المراقبة الخارجية',
    suggestedAction: 'التحقق من الغرض + طلب التصريح',
    description: 'أشخاص يلتقطون صور قرب السياج الخارجي'
  },
  {
    id: '11',
    timestamp: '2025-01-14T23:15:00',
    sensorId: 'SENSOR_003',
    eventType: 'noise',
    riskLevel: 'high',
    latitude: 24.7250,
    longitude: 46.6825,
    zone: 'الزاوية الشمالية الشرقية',
    suggestedAction: 'استجابة فورية + فحص أمني شامل',
    description: 'أصوات عالية غير مألوفة - محتمل محاولة اختراق'
  },
  {
    id: '12',
    timestamp: '2025-01-14T21:40:00',
    sensorId: 'SENSOR_010',
    eventType: 'animal',
    riskLevel: 'medium',
    latitude: 24.7185,
    longitude: 46.6690,
    zone: 'منطقة التخزين',
    suggestedAction: 'تفقد المخزن + تأمين المنطقة',
    description: 'حيوانات ضالة تحاول الدخول لمنطقة التخزين'
  }
];

export const mockSensors: SensorLocation[] = [
  {
    id: '1',
    sensorId: 'SENSOR_001',
    latitude: 24.7136,
    longitude: 46.6753,
    status: 'active',
    lastPing: '2025-01-15T22:45:30'
  },
  {
    id: '2',
    sensorId: 'SENSOR_002',
    latitude: 24.7205,
    longitude: 46.6780,
    status: 'active',
    lastPing: '2025-01-15T22:45:25'
  },
  {
    id: '3',
    sensorId: 'SENSOR_003',
    latitude: 24.7245,
    longitude: 46.6820,
    status: 'active',
    lastPing: '2025-01-15T22:45:28'
  },
  {
    id: '4',
    sensorId: 'SENSOR_004',
    latitude: 24.7223,
    longitude: 46.6790,
    status: 'active',
    lastPing: '2025-01-15T22:45:20'
  },
  {
    id: '5',
    sensorId: 'SENSOR_005',
    latitude: 24.7167,
    longitude: 46.6725,
    status: 'active',
    lastPing: '2025-01-15T22:45:32'
  },
  {
    id: '6',
    sensorId: 'SENSOR_006',
    latitude: 24.7178,
    longitude: 46.6710,
    status: 'active',
    lastPing: '2025-01-15T22:45:15'
  },
  {
    id: '7',
    sensorId: 'SENSOR_007',
    latitude: 24.7189,
    longitude: 46.6698,
    status: 'active',
    lastPing: '2025-01-15T22:45:27'
  },
  {
    id: '8',
    sensorId: 'SENSOR_008',
    latitude: 24.7198,
    longitude: 46.6765,
    status: 'active',
    lastPing: '2025-01-15T22:45:22'
  },
  {
    id: '9',
    sensorId: 'SENSOR_009',
    latitude: 24.7212,
    longitude: 46.6742,
    status: 'inactive',
    lastPing: '2025-01-15T20:30:00'
  },
  {
    id: '10',
    sensorId: 'SENSOR_010',
    latitude: 24.7185,
    longitude: 46.6690,
    status: 'active',
    lastPing: '2025-01-15T22:45:29'
  }
];

export const getStatistics = (): Statistics => {
  const highRisk = mockEvents.filter(e => e.riskLevel === 'high').length;
  const mediumRisk = mockEvents.filter(e => e.riskLevel === 'medium').length;
  const lowRisk = mockEvents.filter(e => e.riskLevel === 'low').length;
  
  return {
    totalEvents: mockEvents.length,
    highRiskEvents: highRisk,
    mediumRiskEvents: mediumRisk,
    lowRiskEvents: lowRisk,
    eventsToday: mockEvents.length
  };
};
