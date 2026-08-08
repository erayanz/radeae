import { httpClient } from './httpClient';

export interface AssignableUser {
  id: string;
  username: string;
  role: 'operator' | 'admin';
}

export const usersApi = {
  async getUsers(): Promise<AssignableUser[]> {
    try {
      const response = await httpClient.get('/users');
      return response.data.data || [];
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      throw error;
    }
  }
};
