import { httpClient } from './httpClient';

export interface AuthUser {
  username: string;
  role: 'operator' | 'admin';
  siteIds: string[];
}

export const authApi = {
  login: async (username: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    const response = await httpClient.post('/auth/login', { username, password });
    return response.data.data;
  }
};
