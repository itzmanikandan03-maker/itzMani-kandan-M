import api from './api';

export interface ExpenseItem {
  id: number;
  user_id: number;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  amount: number;
  description: string;
  payment_method: string;
  expense_date: string;
  created_at: string;
}

export interface ExpenseFilters {
  category_id?: number | string;
  category?: string;
  start_date?: string;
  end_date?: string;
  month?: number | string;
  year?: number | string;
  payment_method?: string;
  min_amount?: number | string;
  max_amount?: number | string;
  search?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export const expenseService = {
  async getExpenses(filters: ExpenseFilters = {}) {
    const res = await api.get('/expenses', { params: filters });
    return res.data;
  },

  async getExpenseById(id: number) {
    const res = await api.get(`/expenses/${id}`);
    return res.data;
  },

  async addExpense(data: {
    amount: number;
    description: string;
    category_id?: number;
    payment_method?: string;
    expense_date?: string;
  }) {
    const res = await api.post('/expenses', data);
    return res.data;
  },

  async updateExpense(id: number, data: Partial<ExpenseItem>) {
    const res = await api.put(`/expenses/${id}`, data);
    return res.data;
  },

  async deleteExpense(id: number) {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  },

  async predictCategory(description: string) {
    const res = await api.post('/expenses/categorize', { description });
    return res.data;
  },
};
