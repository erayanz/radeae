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

export interface Sensor {
  id: string;
  siteId: string;
  sensorLabel: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive';
}

export interface Zone {
  id: string;
  siteId: string;
  name: string;
}

export interface UpdateStatusPayload {
  status: 'acknowledged' | 'resolved';
  assignedTo?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface FilterParams {
  timeRange?: 'hour' | 'day' | 'week' | 'all';
  eventType?: string;
  riskLevel?: string;
  limit?: number;
  offset?: number;
  // Restricts results to events assigned to this username. Set internally by
  // the controller for non-admin callers -- never taken from client-supplied
  // query params, so a caller can't request another user's assigned events.
  assignedToUsername?: string;
}

export interface Statistics {
  totalEvents: number;
  highRiskEvents: number;
  mediumRiskEvents: number;
  lowRiskEvents: number;
  eventsByType: {
    human: number;
    vehicle: number;
    animal: number;
    noise: number;
  };
  eventsToday: number;
}
