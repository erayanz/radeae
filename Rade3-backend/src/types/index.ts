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
