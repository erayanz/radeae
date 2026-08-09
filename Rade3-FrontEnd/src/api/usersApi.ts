import { httpClient } from './httpClient';

export interface AssignableUser {
  id: string;
  username: string;
  role: 'operator' | 'admin';
  active: boolean;
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
  },

  async createUser(username: string, password: string, role: 'operator' | 'admin', siteIds: string[]): Promise<AssignableUser> {
    const response = await httpClient.post('/users', { username, password, role, siteIds });
    return response.data.data;
  },

  async setUserActive(id: string, active: boolean): Promise<AssignableUser> {
    const response = await httpClient.patch(`/users/${id}/active`, { active });
    return response.data.data;
  }
};
