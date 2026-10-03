import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { ExpenseItem } from '../services/expenseService';

interface TransactionTableProps {
  expenses: ExpenseItem[];
  onEdit?: (expense: ExpenseItem) => void;
  onDelete?: (id: number) => void;
  loading?: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  expenses,
  onEdit,
  onDelete,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        Loading transactions...
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-500">
        No transactions recorded for the selected filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/75">
            <th className="py-2.5 px-3 font-medium">Date</th>
            <th className="py-2.5 px-3 font-medium">Description</th>
            <th className="py-2.5 px-3 font-medium">Category</th>
            <th className="py-2.5 px-3 font-medium">Payment</th>
            <th className="py-2.5 px-3 font-medium text-right">Amount</th>
            {(onEdit || onDelete) && (
              <th className="py-2.5 px-3 font-medium text-right w-20">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {expenses.map((expense) => {
            const formattedDate = expense.expense_date
              ? new Date(expense.expense_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—';

            return (
              <tr key={expense.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formattedDate}</td>
                <td className="py-3 px-3 font-medium text-slate-900">{expense.description}</td>
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    {expense.category_name || 'Other'}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{expense.payment_method}</td>
                <td className="py-3 px-3 font-semibold text-rose-600 text-right whitespace-nowrap">
                  -₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                {(onEdit || onDelete) && (
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 text-slate-400">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(expense)}
                          className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
