import { SensorConfig } from '../types/sensor';

export const SENSORS: SensorConfig[] = [
  { id: 'SENSOR_001', latitude: 25.9000, longitude: 45.6500, zone: 'بوابة الدخول الشمالية', active: true, lastDetection: null },
  { id: 'SENSOR_002', latitude: 25.7500, longitude: 45.6500, zone: 'بوابة الدخول الجنوبية', active: true, lastDetection: null },
  { id: 'SENSOR_003', latitude: 25.8389, longitude: 45.6667, zone: 'مركز روضة التنهات', active: true, lastDetection: null },
  { id: 'SENSOR_004', latitude: 25.8000, longitude: 45.7000, zone: 'روضة الخفس', active: true, lastDetection: null },
  { id: 'SENSOR_005', latitude: 25.9000, longitude: 45.5500, zone: 'الزاوية الشمالية الغربية', active: true, lastDetection: null },
  { id: 'SENSOR_006', latitude: 25.9000, longitude: 45.7500, zone: 'الزاوية الشمالية الشرقية', active: true, lastDetection: null },
  { id: 'SENSOR_007', latitude: 25.7500, longitude: 45.7500, zone: 'الزاوية الجنوبية الشرقية', active: true, lastDetection: null },
  { id: 'SENSOR_008', latitude: 25.7500, longitude: 45.5500, zone: 'الزاوية الجنوبية الغربية', active: true, lastDetection: null }
];

export const EVENT_TYPES = ['human', 'vehicle', 'animal', 'noise'] as const;
export const RISK_LEVELS = ['low', 'medium', 'high'] as const;

export const EVENT_DESCRIPTIONS: Record<string, string> = {
  human: 'حركة إنسان مشبوهة',
  vehicle: 'اكتشاف مركبة غير مصرح بها',
  animal: 'حركة حيوان بري',
  noise: 'ضوضاء غير طبيعية'
};
