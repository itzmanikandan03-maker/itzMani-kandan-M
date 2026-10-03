import api from './api';

export interface CategoryItem {
  id: number;
  name: string;
  icon: string;
}

export interface BudgetItem {
  id: number;
  user_id: number;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  amount: number;
  month: number;
  year: number;
  spent?: number;
  remaining?: number;
  utilization_percentage?: number;
  status?: 'normal' | 'warning' | 'exceeded';
  created_at: string;
}

export const budgetService = {
  async getCategories(): Promise<CategoryItem[]> {
    const res = await api.get('/categories');
    return res.data.data || [];
  },

  async getBudgets(params?: { month?: number | string; year?: number | string }) {
    const res = await api.get('/budgets', { params });
    return res.data;
  },

  async createOrUpdateBudget(data: { category_id: number; amount: number; month?: number; year?: number }) {
    const res = await api.post('/budgets', data);
    return res.data;
  },

  async updateBudget(id: number, data: { amount: number }) {
    const res = await api.put(`/budgets/${id}`, data);
    return res.data;
  },

  async deleteBudget(id: number) {
    const res = await api.delete(`/budgets/${id}`);
    return res.data;
  },
};
