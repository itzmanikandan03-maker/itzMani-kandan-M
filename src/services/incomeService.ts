import api from './api';

export interface IncomeItem {
  id: number;
  user_id: number;
  amount: number;
  source: string;
  date: string;
  description: string;
  created_at: string;
}

export const incomeService = {
  async getIncomes(params?: { month?: number | string; year?: number | string }) {
    const res = await api.get('/income', { params });
    return res.data;
  },

  async addIncome(data: { amount: number; source: string; date?: string; description?: string }) {
    const res = await api.post('/income', data);
    return res.data;
  },

  async updateIncome(id: number, data: Partial<IncomeItem>) {
    const res = await api.put(`/income/${id}`, data);
    return res.data;
  },

  async deleteIncome(id: number) {
    const res = await api.delete(`/income/${id}`);
    return res.data;
  },
};
