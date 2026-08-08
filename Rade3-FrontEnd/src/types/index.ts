export interface Event {
  id: string;
  timestamp: string;
  sensorId: string;
  siteId: string;
  eventType: 'human' | 'vehicle' | 'animal' | 'noise';
  riskLevel: 'low' | 'medium' | 'high';
  latitude: number;
  longitude: number;
  zone: string;
  suggestedAction: string;
  description: string;
  status: 'new' | 'acknowledged' | 'resolved';
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  assignedTo: string | null;
}

export interface Site {
  id: string;
  name: string;
  nameAr: string;
  centerLatitude: number;
  centerLongitude: number;
  boundaryPolygon: string | null;
  protectionRadiusMeters: number | null;
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
