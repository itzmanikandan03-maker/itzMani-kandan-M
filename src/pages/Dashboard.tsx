import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  PieChart as PieIcon,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import BudgetCard from '../components/BudgetCard';
import RecommendationCard from '../components/RecommendationCard';
import TransactionTable from '../components/TransactionTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyticsService } from '../services/analyticsService';
import { recommendationService } from '../services/recommendationService';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getDashboard({
        month: selectedMonth,
        year: selectedYear,
      });
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadDashboardData();

    // Listen to global expense creation
    const handler = () => loadDashboardData();
    window.addEventListener('expense_created', handler);
    return () => window.removeEventListener('expense_created', handler);
  }, [loadDashboardData]);

  const handleMarkRecommendationRead = async (id: number) => {
    try {
      await recommendationService.markAsRead(id);
      setData((prev: any) => ({
        ...prev,
        recommendations: prev.recommendations.map((r: any) =>
          r.id === id ? { ...r, is_read: true } : r
        ),
      }));
    } catch {
      // ignore
    }
  };

  if (loading && !data) {
    return <LoadingSpinner message="Calculating financial metrics..." size="lg" />;
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="mt-1">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    summary,
    category_breakdown,
    recent_expenses,
    budget_status,
    recommendations,
    prediction,
  } = data || {};

  // Bar chart data comparing Income vs Expense
  const cashflowBarData = [
    { name: 'Income', amount: summary?.total_income || 0, fill: '#10b981' },
    { name: 'Expenses', amount: summary?.total_expenses || 0, fill: '#ef4444' },
    { name: 'Net Savings', amount: Math.max(0, summary?.savings || 0), fill: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* Date Filter & Overview Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Financial Health Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time analytics and predictive projections for your account
          </p>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Primary Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={`₹${(summary?.total_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext="Current month earnings"
          icon={TrendingUp}
          variant="income"
        />
        <StatCard
          title="Total Expenses"
          value={`₹${(summary?.total_expenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext={`${recent_expenses?.length || 0} logged transactions`}
          icon={TrendingDown}
          variant="expense"
        />
        <StatCard
          title="Remaining Balance"
          value={`₹${(summary?.remaining_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext={summary?.remaining_balance >= 0 ? 'Positive cashflow' : 'Deficit this month'}
          icon={Wallet}
          variant={summary?.remaining_balance >= 0 ? 'default' : 'warning'}
        />
        <StatCard
          title="Savings & Rate"
          value={`₹${(summary?.savings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext={`${summary?.savings_percentage || 0}% savings rate`}
          icon={PiggyBank}
          variant="savings"
        />
      </div>

      {/* Spending Prediction Banner */}
      {prediction && prediction.current_expenses > 0 && (
        <div className={`p-4 rounded-lg border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          prediction.is_over_budget_projected
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className={`p-1.5 rounded mt-0.5 ${prediction.is_over_budget_projected ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold">
                Month-End Run-Rate Forecast: ₹{prediction.predicted_monthly_expense.toLocaleString('en-IN')}
              </p>
              <p className="mt-0.5 text-slate-600">
                Based on your daily average of ₹{prediction.daily_average.toLocaleString('en-IN')} across {prediction.days_elapsed} elapsed days ({prediction.days_remaining} days remaining).
                {prediction.is_over_budget_projected && (
                  <span className="font-medium text-amber-800 ml-1">
                    Projected to exceed budget by ₹{prediction.projected_overspend.toLocaleString('en-IN')}.
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link
            to="/analytics"
            className="shrink-0 text-xs font-medium text-slate-900 underline hover:no-underline"
          >
            Detailed Analytics →
          </Link>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Breakdown */}
        <ChartCard
          title="Expense Breakdown"
          subtitle="Proportional spend by category"
          action={
            <Link to="/expenses" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
              View all
            </Link>
          }
        >
          {category_breakdown && category_breakdown.length > 0 ? (
            <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={category_breakdown}
                      dataKey="spent"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {category_breakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend list */}
              <div className="w-full sm:w-1/2 space-y-1.5 overflow-y-auto max-h-48 text-xs">
                {category_breakdown.map((item: any, idx: number) => (
                  <div key={item.category} className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="truncate text-slate-700">{item.category}</span>
                    </span>
                    <span className="font-semibold text-slate-900 shrink-0">
                      ₹{item.spent.toLocaleString('en-IN')} <span className="text-[11px] text-slate-400 font-normal">({item.percentage}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <PieIcon className="w-8 h-8 text-slate-300 mb-2" />
              No expense data recorded this month.
            </div>
          )}
        </ChartCard>

        {/* Income vs Expenses Cash Flow */}
        <ChartCard
          title="Cash Flow Comparison"
          subtitle="Monthly Income vs Expenses vs Net Savings"
          action={
            <span className="text-xs text-slate-500 font-medium">
              Budget Util: {summary?.budget_utilization || 0}%
            </span>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowBarData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {cashflowBarData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Two Column Section: Budgets & Smart Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Category Budgets Status */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Budget Progress</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tracking category limits and warning levels</p>
            </div>
            <Link
              to="/budgets"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Manage Budgets <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {budget_status && budget_status.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {budget_status.map((b: any) => (
                <BudgetCard key={b.id} budget={b} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">
              No budgets established for this month. Set spending targets to activate automated warnings.
            </div>
          )}
        </div>

        {/* Right 1 Col: AI Recommendations */}
        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">AI Recommendations</h3>
            </div>
            <Link
              to="/assistant"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Chat
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-96">
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec: any) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onMarkRead={handleMarkRecommendationRead}
                />
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">
                Your spending looks healthy! No active budget alerts.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest expenditure entries</p>
          </div>
          <Link
            to="/expenses"
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            All Expenses <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <TransactionTable expenses={recent_expenses || []} />
      </div>
    </div>
  );
};

export default Dashboard;
