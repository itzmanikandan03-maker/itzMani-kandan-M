import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { IncomeItem } from '../services/incomeService';

interface IncomeFormProps {
  initialData?: IncomeItem | null;
  onSubmit: (data: {
    amount: number;
    source: string;
    date: string;
    description: string;
  }) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({
  initialData,
  onSubmit,
  onClose,
  isOpen,
}) => {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setAmount(String(initialData.amount));
      setSource(initialData.source);
      setDate(initialData.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setDescription(initialData.description || '');
    } else {
      setAmount('');
      setSource('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    if (!source.trim()) {
      setError('Income source is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        source: source.trim(),
        date,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save income');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            {initialData ? 'Edit Income' : 'Add New Income'}
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
              placeholder="e.g. 50000.00"
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Income Source <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Salary, Freelance, Dividend"
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date Received
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly performance bonus"
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
              {loading ? 'Saving...' : initialData ? 'Update Income' : 'Add Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncomeForm;
