import axios from 'axios';
import { Event } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const eventsApi = {
  async getEvents(filters?: {
    eventType?: string;
    riskLevel?: string;
    timeRange?: string;
  }): Promise<Event[]> {
    try {
      console.log('🔄 API - Fetching events with filters:', filters);
      
      const response = await axios.get(`${API_BASE_URL}/events`, {
        params: filters
      });

      console.log('✅ API - Response received:', {
        status: response.status,
        dataType: typeof response.data,
        hasData: !!response.data.data,
        count: response.data.data?.length || 0
      });

      // ✅ التأكد من استخراج البيانات بشكل صحيح
      const events = response.data.data || response.data || [];
      
      console.log('📊 API - Events extracted:', {
        count: events.length,
        first: events[0],
        last: events[events.length - 1]
      });

      return events;
    } catch (error) {
      console.error('❌ API - Error fetching events:', error);
      throw error;
    }
  },
  
  // جلب حدث واحد
  getEvent: async (id: string): Promise<Event> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('خطأ في جلب الحدث:', error);
      throw error;
    }
  },
  
  // إنشاء حدث جديد
  createEvent: async (event: Omit<Event, 'id'>): Promise<Event> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/events`, event);
      return response.data.data;
    } catch (error) {
      console.error('خطأ في إنشاء الحدث:', error);
      throw error;
    }
  },
  
  // جلب الإحصائيات
  getStatistics: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events/stats`);
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
      const response = await axios.get(`${baseUrl}/api/health`);
      return response.data;
    } catch (error) {
      console.error('خطأ في فحص صحة API:', error);
      throw error;
    }
  }
};
