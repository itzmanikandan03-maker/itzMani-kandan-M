import api from './api';

export interface RecommendationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low' | 'info';
  is_read: boolean;
  created_at: string;
}

export interface SavingsGoalItem {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  progress_percentage?: number;
  target_date: string;
  description: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  is_read: boolean;
  created_at: string;
}

export const recommendationService = {
  async getRecommendations() {
    const res = await api.get('/recommendations');
    return res.data;
  },

  async generateRecommendations() {
    const res = await api.post('/recommendations/generate');
    return res.data;
  },

  async markAsRead(id: number) {
    const res = await api.put(`/recommendations/${id}/read`);
    return res.data;
  },

  async getSavingsGoals() {
    const res = await api.get('/savings-goals');
    return res.data;
  },

  async createSavingsGoal(data: {
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date: string;
    description?: string;
  }) {
    const res = await api.post('/savings-goals', data);
    return res.data;
  },

  async updateSavingsGoal(id: number, data: Partial<SavingsGoalItem> & { add_amount?: number }) {
    const res = await api.put(`/savings-goals/${id}`, data);
    return res.data;
  },

  async deleteSavingsGoal(id: number) {
    const res = await api.delete(`/savings-goals/${id}`);
    return res.data;
  },

  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },

  async markNotificationRead(id: number) {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  async askAssistant(message: string) {
    const res = await api.post('/assistant', { message });
    return res.data;
  },
};
