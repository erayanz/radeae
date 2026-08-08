import { httpClient } from './httpClient';
import { Site } from '../types';

export const sitesApi = {
  getSites: async (): Promise<Site[]> => {
    try {
      const response = await httpClient.get('/sites');
      return response.data.data || [];
    } catch (error) {
      console.error('خطأ في جلب المواقع:', error);
      throw error;
    }
  }
};
