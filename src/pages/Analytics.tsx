import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import ChartCard from '../components/ChartCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyticsService } from '../services/analyticsService';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, trendsRes, predRes] = await Promise.all([
        analyticsService.getMonthly({ month: selectedMonth, year: selectedYear }),
        analyticsService.getCategoryBreakdown({ month: selectedMonth, year: selectedYear }),
        analyticsService.getTrends(),
        analyticsService.getPrediction(),
      ]);

      if (sumRes.success) setMonthlySummary(sumRes.data);
      if (catRes.success) setCategoryBreakdown(catRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (predRes.success) setPrediction(predRes.data);
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Financial Analytics & Forecasting</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical breakdown, monthly run-rate projections, and cash flow trends
          </p>
        </div>

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

      {loading ? (
        <LoadingSpinner message="Generating analytical charts..." size="lg" />
      ) : (
        <>
          {/* Prediction Metric Callout */}
          {prediction && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-purple-50 text-purple-700">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Run-Rate Month-End Projection</h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  (Confidence: {prediction.confidence})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-slate-500 block mb-1">Current Month Spent</span>
                  <span className="text-base font-bold text-slate-900">
                    ₹{prediction.current_expenses.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-slate-500 block mb-1">Daily Average</span>
                  <span className="text-base font-bold text-slate-900">
                    ₹{prediction.daily_average.toLocaleString('en-IN')} / day
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-slate-500 block mb-1">Projected Total</span>
                  <span className={`text-base font-bold ${prediction.is_over_budget_projected ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{prediction.predicted_monthly_expense.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-slate-500 block mb-1">Projected Budget Diff</span>
                  <span className={`text-base font-bold ${prediction.budget_difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {prediction.budget_difference >= 0 ? `+₹${prediction.budget_difference.toLocaleString('en-IN')}` : `-₹${Math.abs(prediction.budget_difference).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row 1: Historical Cash Flow Trends & Income vs Expense */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical Trend Line Chart */}
            <ChartCard
              title="Multi-Month Cashflow Trends"
              subtitle="Income vs Expense trajectory over recorded months"
            >
              <div className="h-72">
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                      />
                      <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`]} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="expense" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Not enough trend history available. Log transactions across multiple months.
                  </div>
                )}
              </div>
            </ChartCard>

            {/* Category Allocation Donut Chart */}
            <ChartCard
              title="Category Allocation"
              subtitle="Breakdown of expenditure distribution"
            >
              <div className="h-72 flex flex-col sm:flex-row items-center justify-center gap-4">
                {categoryBreakdown.length > 0 ? (
                  <>
                    <div className="w-full sm:w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryBreakdown}
                            dataKey="spent"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {categoryBreakdown.map((_, idx) => (
                              <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full sm:w-1/2 space-y-1.5 overflow-y-auto max-h-56 text-xs">
                      {categoryBreakdown.map((item, idx) => (
                        <div key={item.category} className="flex items-center justify-between py-1 border-b border-slate-100">
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-slate-700 truncate">{item.category}</span>
                          </span>
                          <span className="font-semibold text-slate-900 shrink-0">
                            ₹{item.spent.toLocaleString('en-IN')} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No category data for this month.
                  </div>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Category Comparison & Budget Utilization Table */}
          <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Category Spending vs Budget Limits</h3>
            <p className="text-xs text-slate-500 mb-4">Detailed utilization metric breakdown per category</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/75">
                    <th className="py-2.5 px-3 font-medium">Category</th>
                    <th className="py-2.5 px-3 font-medium text-right">Transactions</th>
                    <th className="py-2.5 px-3 font-medium text-right">Spent</th>
                    <th className="py-2.5 px-3 font-medium text-right">Budget Limit</th>
                    <th className="py-2.5 px-3 font-medium text-right">Utilization</th>
                    <th className="py-2.5 px-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryBreakdown.map((cat) => {
                    const isOver = cat.budget > 0 && cat.spent > cat.budget;
                    const isNear = cat.budget > 0 && !isOver && cat.budget_utilization >= 80;

                    return (
                      <tr key={cat.category} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900">{cat.category}</td>
                        <td className="py-3 px-3 text-right text-slate-500">{cat.count}</td>
                        <td className="py-3 px-3 text-right font-medium text-slate-900">
                          ₹{cat.spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500">
                          {cat.budget > 0 ? `₹${cat.budget.toLocaleString('en-IN')}` : 'No Budget'}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-800">
                          {cat.budget > 0 ? `${cat.budget_utilization}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {cat.budget <= 0 ? (
                            <span className="text-slate-400">Unrestricted</span>
                          ) : isOver ? (
                            <span className="text-rose-600 font-semibold">Exceeded</span>
                          ) : isNear ? (
                            <span className="text-amber-600 font-medium">Warning (80%+)</span>
                          ) : (
                            <span className="text-emerald-600 font-medium">On Track</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
