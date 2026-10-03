import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export const authService = {
  async register(data: { name: string; email: string; password: string; confirm_password: string }) {
    const res = await api.post('/auth/register', data);
    if (res.data.success && res.data.data?.token) {
      localStorage.setItem('pocketsmart_token', res.data.data.token);
      localStorage.setItem('pocketsmart_user', JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post('/auth/login', data);
    if (res.data.success && res.data.data?.token) {
      localStorage.setItem('pocketsmart_token', res.data.data.token);
      localStorage.setItem('pocketsmart_user', JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        localStorage.setItem('pocketsmart_user', JSON.stringify(res.data.data.user));
        return res.data.data.user;
      }
      return null;
    } catch {
      return null;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('pocketsmart_token');
      localStorage.removeItem('pocketsmart_user');
    }
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('pocketsmart_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('pocketsmart_token');
  }
};
