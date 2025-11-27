export interface SensorEvent {
  sensorId: string;
  eventType: 'human' | 'vehicle' | 'animal' | 'noise';
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: string;
  latitude: number;
  longitude: number;
  zone: string;
  description: string;
}

export interface SensorConfig {
  id: string;
  latitude: number;
  longitude: number;
  zone: string;
  active: boolean;
  lastDetection: string | null;
}

export interface SimulationState {
  isRunning: boolean;
  totalEventsGenerated: number;
  lastEventTime: string | null;
  sensors: SensorConfig[];
}
