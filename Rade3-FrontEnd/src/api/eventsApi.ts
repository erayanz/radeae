import { httpClient, API_BASE_URL } from './httpClient';
import { Event } from '../types';

export const eventsApi = {
  async getEvents(siteId: string, filters?: {
    eventType?: string;
    riskLevel?: string;
    timeRange?: string;
  }): Promise<Event[]> {
    try {
      const response = await httpClient.get(`/sites/${siteId}/events`, { params: filters });
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('❌ API - Error fetching events:', error);
      throw error;
    }
  },

  // جلب حدث واحد
  getEvent: async (siteId: string, id: string): Promise<Event> => {
    try {
      const response = await httpClient.get(`/sites/${siteId}/events/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('خطأ في جلب الحدث:', error);
      throw error;
    }
  },

  // إنشاء حدث جديد
  createEvent: async (siteId: string, event: Omit<Event, 'id'>): Promise<Event> => {
    try {
      const response = await httpClient.post(`/sites/${siteId}/events`, event);
      return response.data.data;
    } catch (error) {
      console.error('خطأ في إنشاء الحدث:', error);
      throw error;
    }
  },

  // جلب الإحصائيات
  getStatistics: async (siteId: string) => {
    try {
      const response = await httpClient.get(`/sites/${siteId}/events/stats`);
      return response.data.data;
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
      throw error;
    }
  },

  // فحص صحة الـ API
  healthCheck: async () => {
    try {
      const baseUrl = API_BASE_URL.replace('/api/v1', '');
      const response = await httpClient.get(`${baseUrl}/api/health`);
      return response.data;
    } catch (error) {
      console.error('خطأ في فحص صحة API:', error);
      throw error;
    }
  },

  // مسح جميع الأحداث
  clearAllEvents: async (siteId: string) => {
    try {
      const response = await httpClient.delete(`/sites/${siteId}/events/clear`);
      return response.data;
    } catch (error) {
      console.error('خطأ في مسح الأحداث:', error);
      throw error;
    }
  },

  // تحديث حالة الحدث
  updateEventStatus: async (siteId: string, id: string, status: 'acknowledged' | 'resolved', assignedTo?: string): Promise<Event> => {
    try {
      const response = await httpClient.patch(`/sites/${siteId}/events/${id}/status`, {
        status,
        ...(assignedTo ? { assignedTo } : {})
      });
      return response.data.data;
    } catch (error) {
      console.error('خطأ في تحديث حالة الحدث:', error);
      throw error;
    }
  }
};
