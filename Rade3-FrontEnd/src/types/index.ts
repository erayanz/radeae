export interface Event {
  id: string;
  timestamp: string;
  sensorId: string;
  eventType: 'human' | 'vehicle' | 'animal' | 'noise';
  riskLevel: 'low' | 'medium' | 'high';
  latitude: number;
  longitude: number;
  zone: string;
  suggestedAction: string;
  description: string;
}

export interface SensorLocation {
  id: string;
  sensorId: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive';
  lastPing: string;
}

export interface Statistics {
  totalEvents: number;
  highRiskEvents: number;
  mediumRiskEvents: number;
  lowRiskEvents: number;
  eventsToday: number;
}
