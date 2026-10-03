import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { expenseService, ExpenseItem } from '../services/expenseService';
import { budgetService, CategoryItem } from '../services/budgetService';
import TransactionTable from '../components/TransactionTable';
import ExpenseForm from '../components/ExpenseForm';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<number | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseService.getExpenses({
        search: search.trim() || undefined,
        category_id: selectedCategory ? Number(selectedCategory) : undefined,
        payment_method: selectedMethod || undefined,
        min_amount: minAmount ? Number(minAmount) : undefined,
        max_amount: maxAmount ? Number(maxAmount) : undefined,
        sort: sortBy,
        page: currentPage,
        per_page: 25,
      });

      if (res.success && res.data) {
        setExpenses(res.data.expenses);
        setTotalCount(res.data.total);
        setTotalPages(res.data.total_pages);
      }
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedMethod, minAmount, maxAmount, sortBy, currentPage]);

  useEffect(() => {
    budgetService.getCategories().then((cats) => setCategories(cats)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCreateOrUpdate = async (formData: any) => {
    if (editingExpense) {
      await expenseService.updateExpense(editingExpense.id, formData);
    } else {
      await expenseService.addExpense(formData);
    }
    setEditingExpense(null);
    setIsModalOpen(false);
    fetchExpenses();
  };

  const handleDelete = (id: number) => {
    setDeleteExpenseId(id);
  };

  const confirmDeleteExpense = async () => {
    if (deleteExpenseId) {
      await expenseService.deleteExpense(deleteExpenseId);
      setDeleteExpenseId(null);
      fetchExpenses();
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['ID', 'Date', 'Description', 'Category', 'Payment Method', 'Amount'];
    const rows = expenses.map(e => [
      e.id,
      e.expense_date,
      `"${e.description.replace(/"/g, '""')}"`,
      e.category_name || 'Other',
      e.payment_method,
      e.amount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pocketsmart_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Expenses Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalCount} transaction(s) recorded in your database
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition shadow-2xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="relative">
            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="date_desc">Latest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs">
        {loading ? (
          <LoadingSpinner message="Fetching transactions..." />
        ) : (
          <>
            <TransactionTable
              expenses={expenses}
              onEdit={(exp) => {
                setEditingExpense(exp);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 text-xs">
                <span className="text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="px-2.5 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="px-2.5 py-1 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <ExpenseForm
        categories={categories}
        initialData={editingExpense}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteExpenseId !== null}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        confirmText="Delete Expense"
        onConfirm={confirmDeleteExpense}
        onCancel={() => setDeleteExpenseId(null)}
      />
    </div>
  );
};

export default Expenses;
