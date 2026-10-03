import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, PieChart as PieIcon, X } from 'lucide-react';
import { budgetService, BudgetItem, CategoryItem } from '../services/budgetService';
import BudgetCard from '../components/BudgetCard';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';

export const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetService.getBudgets({
        month: selectedMonth,
        year: selectedYear,
      });
      if (res.success && res.data) {
        setBudgets(res.data);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    budgetService.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setAmount('');
    if (categories.length > 0) setCategoryId(categories[0].id);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BudgetItem) => {
    setEditingBudget(b);
    setCategoryId(b.category_id);
    setAmount(String(b.amount));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setFormError('Please enter a valid positive budget amount');
      return;
    }

    setSaving(true);
    try {
      if (editingBudget) {
        await budgetService.updateBudget(editingBudget.id, { amount: num });
      } else {
        await budgetService.createOrUpdateBudget({
          category_id: Number(categoryId),
          amount: num,
          month: selectedMonth,
          year: selectedYear,
        });
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteBudgetId(id);
  };

  const confirmDeleteBudget = async () => {
    if (deleteBudgetId) {
      await budgetService.deleteBudget(deleteBudgetId);
      setDeleteBudgetId(null);
      fetchBudgets();
    }
  };

  const totalAllocated = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const overallUtil = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Category Budgets</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Allocated: <strong className="text-slate-800">₹{totalAllocated.toLocaleString('en-IN')}</strong> · Total Spent: <strong className="text-slate-800">₹{totalSpent.toLocaleString('en-IN')}</strong> ({overallUtil}% used)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <span>/</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Set Budget
          </button>
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <LoadingSpinner message="Calculating category allocations..." />
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200/90 p-12 text-center text-xs text-slate-500 shadow-xs">
          <PieIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800 text-sm">No Budgets Configured</h3>
          <p className="mt-1 text-slate-500 max-w-sm mx-auto">
            You have not set any spending limits for this month. Create limits for Food, Transport, or Shopping to receive warnings before you overspend.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
          >
            Create First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingBudget ? 'Edit Budget' : 'Set Category Budget'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  disabled={!!editingBudget}
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Monthly Limit Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteBudgetId !== null}
        title="Delete Budget"
        message="Are you sure you want to remove this budget allocation? Spending will no longer be tracked against a target for this category."
        confirmText="Delete Budget"
        onConfirm={confirmDeleteBudget}
        onCancel={() => setDeleteBudgetId(null)}
      />
    </div>
  );
};

export default Budgets;
