import api from './api';

export const analyticsService = {
  async getDashboard(params?: { month?: number | string; year?: number | string }) {
    const res = await api.get('/dashboard', { params });
    return res.data;
  },

  async getMonthly(params?: { month?: number | string; year?: number | string }) {
    const res = await api.get('/analytics/monthly', { params });
    return res.data;
  },

  async getCategoryBreakdown(params?: { month?: number | string; year?: number | string }) {
    const res = await api.get('/analytics/categories', { params });
    return res.data;
  },

  async getTrends() {
    const res = await api.get('/analytics/trends');
    return res.data;
  },

  async getCashflow(params?: { month?: number | string; year?: number | string }) {
    const res = await api.get('/analytics/cashflow', { params });
    return res.data;
  },

  async getPrediction() {
    const res = await api.get('/analytics/prediction');
    return res.data;
  },
};
