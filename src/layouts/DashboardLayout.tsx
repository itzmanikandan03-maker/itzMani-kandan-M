import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ExpenseForm from '../components/ExpenseForm';
import IncomeForm from '../components/IncomeForm';
import AndroidBottomNav from '../components/AndroidBottomNav';
import AndroidQuickActionSheet from '../components/AndroidQuickActionSheet';
import AndroidInstallModal from '../components/AndroidInstallModal';
import OfflineIndicator from '../components/OfflineIndicator';
import { useAuth } from '../hooks/useAuth';
import { useAndroid } from '../context/AndroidContext';
import { budgetService, CategoryItem } from '../services/budgetService';
import { expenseService } from '../services/expenseService';
import { incomeService } from '../services/incomeService';

export const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { isInstallModalOpen, closeInstallModal } = useAndroid();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    budgetService.getCategories().then((data) => {
      setCategories(data);
    }).catch(() => {});
  }, []);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard Overview';
      case '/expenses':
        return 'Expense Management';
      case '/income':
        return 'Income Stream';
      case '/budgets':
        return 'Monthly Budgets';
      case '/analytics':
        return 'Financial Analytics & Projection';
      case '/savings-goals':
        return 'Savings Goals';
      case '/assistant':
        return 'PocketSmart AI Assistant';
      case '/profile':
        return 'User Profile & Settings';
      default:
        return 'PocketSmart AI';
    }
  };

  const handleCreateExpense = async (data: {
    amount: number;
    description: string;
    category_id?: number;
    payment_method: string;
    expense_date: string;
  }) => {
    await expenseService.addExpense(data);
    window.dispatchEvent(new Event('expense_created'));
  };

  const handleCreateIncome = async (data: {
    amount: number;
    source: string;
    date: string;
    description: string;
  }) => {
    await incomeService.addIncome(data);
    window.dispatchEvent(new Event('income_created'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-slate-400 font-medium">
        Loading PocketSmart AI...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Offline Status Pill for Android */}
      <OfflineIndicator />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 w-72 h-full bg-slate-900 shadow-2xl border-r border-slate-800">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Navbar
          title={getPageTitle(location.pathname)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        />

        {/* Scrollable Main viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>

        {/* Android Material 3 Bottom Navigation for Mobile / Android View */}
        <AndroidBottomNav onOpenQuickAction={() => setIsQuickActionOpen(true)} />
      </div>

      {/* Android Bottom Sheet Quick Actions */}
      <AndroidQuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenAddIncome={() => setIsAddIncomeOpen(true)}
      />

      {/* Quick Add Expense Modal */}
      <ExpenseForm
        categories={categories}
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSubmit={handleCreateExpense}
      />

      {/* Quick Add Income Modal */}
      <IncomeForm
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
        onSubmit={handleCreateIncome}
      />

      {/* Android Installation Modal */}
      <AndroidInstallModal
        isOpen={isInstallModalOpen}
        onClose={closeInstallModal}
      />
    </div>
  );
};

export default DashboardLayout;
