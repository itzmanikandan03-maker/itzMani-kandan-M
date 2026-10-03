import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { BudgetItem } from '../services/budgetService';

interface BudgetCardProps {
  budget: BudgetItem;
  onEdit?: (budget: BudgetItem) => void;
  onDelete?: (id: number) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit, onDelete }) => {
  const spent = budget.spent || 0;
  const total = budget.amount;
  const percentage = budget.utilization_percentage !== undefined
    ? budget.utilization_percentage
    : total > 0 ? Math.round((spent / total) * 100) : 0;

  const isExceeded = spent > total;
  const isWarning = !isExceeded && percentage >= 80;

  let progressColor = 'bg-emerald-500';
  let badgeText = 'On Track';
  let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let Icon = CheckCircle2;

  if (isExceeded) {
    progressColor = 'bg-rose-500';
    badgeText = 'Exceeded';
    badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
    Icon = AlertCircle;
  } else if (isWarning) {
    progressColor = 'bg-amber-500';
    badgeText = 'Near Limit';
    badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
    Icon = AlertTriangle;
  }

  const remaining = total - spent;

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs transition hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900">{budget.category_name || 'Category'}</h4>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${badgeColor}`}>
              <Icon className="w-3 h-3" />
              {badgeText}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isExceeded ? (
              <span className="text-rose-600 font-medium">
                Over budget by ₹{Math.abs(remaining).toLocaleString('en-IN')}
              </span>
            ) : (
              <span>₹{remaining.toLocaleString('en-IN')} left to spend</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {onEdit && (
            <button
              onClick={() => onEdit(budget)}
              className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded transition"
              title="Edit Budget"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(budget.id)}
              className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded transition"
              title="Delete Budget"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-slate-600 font-medium">
            ₹{spent.toLocaleString('en-IN')} <span className="text-slate-400 font-normal">/ ₹{total.toLocaleString('en-IN')}</span>
          </span>
          <span className="text-xs font-semibold text-slate-800">{percentage}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;
