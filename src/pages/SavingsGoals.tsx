import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Target, CheckCircle2, Edit2, Trash2, X, PlusCircle } from 'lucide-react';
import { recommendationService, SavingsGoalItem } from '../services/recommendationService';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';

export const SavingsGoals: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteGoalId, setDeleteGoalId] = useState<number | null>(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoalItem | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Add Money Modal State
  const [addMoneyModalOpen, setAddMoneyModalOpen] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingsGoalItem | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositError, setDepositError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recommendationService.getSavingsGoals();
      if (res.success && res.data) {
        setGoals(res.data);
      }
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: SavingsGoalItem) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setCurrentAmount(String(goal.current_amount));
    setTargetDate(goal.target_date?.split('T')[0] || '');
    setDescription(goal.description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      setFormError('Please enter a valid target amount');
      return;
    }

    if (!name.trim()) {
      setFormError('Goal name is required');
      return;
    }

    if (!targetDate) {
      setFormError('Target date is required');
      return;
    }

    try {
      if (editingGoal) {
        await recommendationService.updateSavingsGoal(editingGoal.id, {
          name: name.trim(),
          target_amount: target,
          current_amount: parseFloat(currentAmount) || 0,
          target_date: targetDate,
          description: description.trim(),
        });
      } else {
        await recommendationService.createSavingsGoal({
          name: name.trim(),
          target_amount: target,
          current_amount: parseFloat(currentAmount) || 0,
          target_date: targetDate,
          description: description.trim(),
        });
      }
      setIsModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save savings goal');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);

    const addAmt = parseFloat(depositAmount);
    if (isNaN(addAmt) || addAmt <= 0) {
      setDepositError('Please enter a valid amount to contribute');
      return;
    }

    if (!selectedGoalForDeposit) return;

    try {
      await recommendationService.updateSavingsGoal(selectedGoalForDeposit.id, {
        add_amount: addAmt,
      });
      setAddMoneyModalOpen(false);
      setDepositAmount('');
      fetchGoals();
    } catch (err: any) {
      setDepositError(err.response?.data?.message || 'Deposit failed');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteGoalId(id);
  };

  const confirmDeleteGoal = async () => {
    if (deleteGoalId) {
      await recommendationService.deleteSavingsGoal(deleteGoalId);
      setDeleteGoalId(null);
      fetchGoals();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Savings Goals</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track milestones, deposit funds, and monitor completion progress
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Goal
        </button>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <LoadingSpinner message="Loading savings milestones..." />
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200/90 p-12 text-center text-xs text-slate-500 shadow-xs">
          <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800 text-sm">No Savings Goals Set</h3>
          <p className="mt-1 text-slate-500 max-w-sm mx-auto">
            Create a goal like "Emergency Reserve", "New Laptop", or "Vacation" to track your progress and automate surplus allocations.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
          >
            Create My First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const target = goal.target_amount || 1;
            const current = goal.current_amount || 0;
            const progress = Math.min(100, Math.round((current / target) * 100));
            const isCompleted = progress >= 100;
            const formattedDate = goal.target_date
              ? new Date(goal.target_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—';

            return (
              <div
                key={goal.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{goal.name}</h4>
                      {goal.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{goal.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                        title="Edit goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-semibold text-slate-900">
                        ₹{current.toLocaleString('en-IN')}{' '}
                        <span className="text-slate-400 font-normal">/ ₹{target.toLocaleString('en-IN')}</span>
                      </span>
                      <span className="text-xs font-bold text-emerald-700">{progress}%</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>Target Date: {formattedDate}</span>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span>₹{(target - current).toLocaleString('en-IN')} remaining</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedGoalForDeposit(goal);
                      setDepositAmount('');
                      setDepositError(null);
                      setAddMoneyModalOpen(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-100 rounded transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Deposit Funds
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Goal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MacBook Pro, Emergency Fund"
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Target Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="150000"
                    className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Current Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Target Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Save 10k monthly from salary"
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition shadow-xs"
                >
                  {editingGoal ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {addMoneyModalOpen && selectedGoalForDeposit && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Deposit to "{selectedGoalForDeposit.name}"
              </h3>
              <button
                onClick={() => setAddMoneyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="p-5 space-y-4 text-xs">
              {depositError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
                  {depositError}
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Amount to Deposit (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  autoFocus
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Current Balance: ₹{selectedGoalForDeposit.current_amount.toLocaleString('en-IN')} of ₹{selectedGoalForDeposit.target_amount.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddMoneyModalOpen(false)}
                  className="px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition shadow-xs"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteGoalId !== null}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal? All tracked deposit history for this goal will be removed."
        confirmText="Delete Goal"
        onConfirm={confirmDeleteGoal}
        onCancel={() => setDeleteGoalId(null)}
      />
    </div>
  );
};

export default SavingsGoals;
