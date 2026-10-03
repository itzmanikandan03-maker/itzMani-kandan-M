import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ArrowDownLeft, Calendar } from 'lucide-react';
import { incomeService, IncomeItem } from '../services/incomeService';
import IncomeForm from '../components/IncomeForm';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';

export const Income: React.FC = () => {
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeItem | null>(null);
  const [deleteIncomeId, setDeleteIncomeId] = useState<number | null>(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | ''>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number | ''>(now.getFullYear());

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await incomeService.getIncomes({
        month: selectedMonth || undefined,
        year: selectedYear || undefined,
      });
      if (res.success && res.data) {
        setIncomes(res.data);
      }
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const handleCreateOrUpdate = async (formData: any) => {
    if (editingIncome) {
      await incomeService.updateIncome(editingIncome.id, formData);
    } else {
      await incomeService.addIncome(formData);
    }
    setEditingIncome(null);
    setIsModalOpen(false);
    fetchIncomes();
  };

  const handleDelete = (id: number) => {
    setDeleteIncomeId(id);
  };

  const confirmDeleteIncome = async () => {
    if (deleteIncomeId) {
      await incomeService.deleteIncome(deleteIncomeId);
      setDeleteIncomeId(null);
      fetchIncomes();
    }
  };

  const totalIncomeAmount = incomes.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Income Sources</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total for selected period: <strong className="text-emerald-700 font-semibold">₹{totalIncomeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : '')}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <span>/</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="">All Years</option>
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setEditingIncome(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Income
          </button>
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs">
        {loading ? (
          <LoadingSpinner message="Loading income records..." />
        ) : incomes.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            <ArrowDownLeft className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No income entries recorded for this period. Click "Add Income" to register salary or consulting income.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/75">
                  <th className="py-2.5 px-3 font-medium">Date</th>
                  <th className="py-2.5 px-3 font-medium">Source</th>
                  <th className="py-2.5 px-3 font-medium">Description</th>
                  <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                  <th className="py-2.5 px-3 font-medium text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomes.map((inc) => {
                  const formattedDate = inc.date
                    ? new Date(inc.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formattedDate}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{inc.source}</td>
                      <td className="py-3 px-3 text-slate-600">{inc.description || '—'}</td>
                      <td className="py-3 px-3 font-bold text-emerald-600 text-right whitespace-nowrap">
                        +₹{Number(inc.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          <button
                            onClick={() => {
                              setEditingIncome(inc);
                              setIsModalOpen(true);
                            }}
                            className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(inc.id)}
                            className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <IncomeForm
        isOpen={isModalOpen}
        initialData={editingIncome}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIncome(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteIncomeId !== null}
        title="Delete Income"
        message="Are you sure you want to delete this income entry? This action cannot be undone."
        confirmText="Delete Income"
        onConfirm={confirmDeleteIncome}
        onCancel={() => setDeleteIncomeId(null)}
      />
    </div>
  );
};

export default Income;
