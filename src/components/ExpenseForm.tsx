import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { ExpenseItem, expenseService } from '../services/expenseService';
import { CategoryItem } from '../services/budgetService';

interface ExpenseFormProps {
  categories: CategoryItem[];
  initialData?: ExpenseItem | null;
  onSubmit: (data: {
    amount: number;
    description: string;
    category_id?: number;
    payment_method: string;
    expense_date: string;
  }) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Other'];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  categories,
  initialData,
  onSubmit,
  onClose,
  isOpen,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setAmount(String(initialData.amount));
      setDescription(initialData.description);
      setCategoryId(initialData.category_id);
      setPaymentMethod(initialData.payment_method || 'UPI');
      setExpenseDate(initialData.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
    } else {
      setAmount('');
      setDescription('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setPaymentMethod('UPI');
      setExpenseDate(new Date().toISOString().split('T')[0]);
    }
    setSuggestedCategory(null);
    setError(null);
  }, [initialData, categories, isOpen]);

  // Intelligent category suggestion on description blur / debounce
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);

    if (val.length >= 3 && !initialData) {
      // Run quick categorization
      expenseService.predictCategory(val).then((res) => {
        if (res.success && res.data?.category_id) {
          setSuggestedCategory(res.data.category_name);
          setCategoryId(res.data.category_id);
        }
      }).catch(() => {});
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        description: description.trim(),
        category_id: categoryId ? Number(categoryId) : undefined,
        payment_method: paymentMethod,
        expense_date: expenseDate,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            {initialData ? 'Edit Expense' : 'Add New Expense'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 450.00"
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Description <span className="text-rose-500">*</span>
              </label>
              {suggestedCategory && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Auto-detected: {suggestedCategory}
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={description}
              onChange={handleDescriptionChange}
              placeholder="e.g. Pizza dinner with friends"
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
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
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
