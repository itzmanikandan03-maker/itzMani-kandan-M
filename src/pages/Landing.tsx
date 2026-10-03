import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  PieChart,
  Target,
  ArrowRight,
  CheckCircle2,
  Lock,
  Smartphone,
  Download,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAndroid } from '../context/AndroidContext';
import { useHaptics } from '../hooks/useHaptics';
import AndroidInstallModal from '../components/AndroidInstallModal';

export const Landing: React.FC = () => {
  const { user, login } = useAuth();
  const { openInstallModal, isInstallModalOpen, closeInstallModal } = useAndroid();
  const haptics = useHaptics();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    haptics.medium();
    setDemoLoading(true);
    setDemoError(null);
    try {
      await login({ email: 'demo@pocketsmart.ai', password: 'Demo@123' });
      navigate('/dashboard');
    } catch {
      setDemoError('Could not sign in to demo account. Please try manual login.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              PocketSmart <span className="text-emerald-400 text-xs uppercase tracking-wider font-semibold">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                haptics.medium();
                openInstallModal();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android App</span>
            </button>

            {user ? (
              <Link
                to="/dashboard"
                onClick={() => haptics.light()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-sm"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => haptics.light()}
                  className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => haptics.light()}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-sm"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Smart Financial Assistant & Android Budget App
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Master your money with real-time financial intelligence on Android.
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          PocketSmart AI tracks your income, budgets, expenses, and savings goals with automated categorization, predictive run-rate projections, and deterministic budgeting advice.
        </p>

        {/* Demo Account Box */}
        <div className="mt-8 p-5 bg-slate-800/80 border border-slate-700/80 rounded-2xl max-w-md mx-auto text-left shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Demo Account</span>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-md">Ready to test</span>
          </div>
          <div className="text-xs text-slate-300 space-y-1 font-mono bg-slate-900/90 p-3 rounded-xl border border-slate-700/60">
            <p><span className="text-slate-500 select-none">Email: </span>demo@pocketsmart.ai</p>
            <p><span className="text-slate-500 select-none">Password: </span>Demo@123</p>
          </div>

          {demoError && (
            <p className="text-xs text-rose-400 mt-2">{demoError}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {demoLoading ? 'Signing in...' : '1-Click Demo Login'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <Link
              to="/login"
              className="px-3.5 py-2.5 text-xs font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 rounded-xl transition text-center"
            >
              Custom Login
            </Link>
          </div>
        </div>

        {/* Android PWA Callout */}
        <div className="mt-6 max-w-md mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-800/60 to-slate-800/40 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">Android WebAPK & PWA</span>
              <span className="text-[11px] text-slate-400 block">Install directly to your Android device</span>
            </div>
          </div>
          <button
            onClick={() => {
              haptics.medium();
              openInstallModal();
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
          >
            Install
          </button>
        </div>

        {/* Value props */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-time Budget Utilization
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automatic Categorization
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Run-Rate Spending Predictions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" /> JWT Isolated Data Privacy
          </span>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-14 bg-slate-950/60 border-t border-slate-800 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Complete Personal Finance Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl mx-auto">
              Built on deterministic calculations, robust statistical forecasting, and zero fabricated financial data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Budget Progress & Warnings</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Set monthly category budgets and receive warnings at 80% utilization, with clear visual alerts when thresholds are exceeded.
              </p>
            </div>

            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Run-Rate Spending Prediction</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Deterministic daily-average extrapolation calculates projected month-end expenditure and alerts you of potential overspends.
              </p>
            </div>

            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Data-Grounded AI Assistant</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ask natural questions about your finances. PocketSmart AI queries your verified database records and never hallucinates numbers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-5 px-4 text-center text-xs text-slate-500">
        <p>PocketSmart AI — Smart Android Budget & Recommendation Assistant · Secure & Private</p>
      </footer>

      {/* Android Install Modal */}
      <AndroidInstallModal
        isOpen={isInstallModalOpen}
        onClose={closeInstallModal}
      />
    </div>
  );
};

export default Landing;
