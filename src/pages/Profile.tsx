import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Shield,
  LogOut,
  CheckCircle2,
  Smartphone,
  Fingerprint,
  Share2,
  Download,
  Vibrate,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAndroid } from '../context/AndroidContext';
import { useHaptics } from '../hooks/useHaptics';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { expenseService } from '../services/expenseService';
import { incomeService } from '../services/incomeService';
import { budgetService } from '../services/budgetService';
import { recommendationService } from '../services/recommendationService';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    openInstallModal,
    biometricLockEnabled,
    toggleBiometricLock,
    deviceFrameEnabled,
    setDeviceFrameEnabled,
  } = useAndroid();
  const { isInstalled, isAndroid } = usePWAInstall();
  const haptics = useHaptics();

  const [stats, setStats] = useState({
    expensesCount: 0,
    incomesCount: 0,
    budgetsCount: 0,
    goalsCount: 0,
  });

  useEffect(() => {
    Promise.all([
      expenseService.getExpenses({ per_page: 1 }),
      incomeService.getIncomes(),
      budgetService.getBudgets(),
      recommendationService.getSavingsGoals(),
    ]).then(([expRes, incRes, budRes, goalRes]) => {
      setStats({
        expensesCount: expRes.data?.total || 0,
        incomesCount: incRes.data?.length || 0,
        budgetsCount: budRes.data?.length || 0,
        goalsCount: goalRes.data?.length || 0,
      });
    }).catch(() => {});
  }, []);

  const handleShare = async () => {
    haptics.medium();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PocketSmart AI — Personal Budget & Finance',
          text: `I am managing my finances with PocketSmart AI! ${stats.expensesCount} expenses tracked and ${stats.goalsCount} savings goals active.`,
          url: window.location.origin,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard?.writeText(window.location.origin);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Account & Android Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage your credentials, Android device integration, and telemetry</p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Share App</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-950/50">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{user?.name}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user?.email}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Authenticated Session
            </span>
          </div>
        </div>

        {/* Database Records Summary */}
        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Financial Ledger Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Expenses Logged</span>
              <span className="text-lg font-bold text-white">{stats.expensesCount}</span>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Income Streams</span>
              <span className="text-lg font-bold text-white">{stats.incomesCount}</span>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Active Budgets</span>
              <span className="text-lg font-bold text-white">{stats.budgetsCount}</span>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Savings Goals</span>
              <span className="text-lg font-bold text-white">{stats.goalsCount}</span>
            </div>
          </div>
        </div>

        {/* Android Device Configuration */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            Android Application Features & Integration
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Install on Android */}
            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="font-semibold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Android WebAPK / PWA
                </span>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Install PocketSmart onto your Android home screen or app drawer with full standalone support and offline access.
                </p>
              </div>
              <button
                onClick={() => {
                  haptics.medium();
                  openInstallModal();
                }}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-sm transition text-center"
              >
                {isInstalled ? 'View Android App Details' : 'Install on Android'}
              </button>
            </div>

            {/* Biometric Lock */}
            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    Android Biometric Lock
                  </span>
                  <button
                    onClick={() => {
                      haptics.medium();
                      toggleBiometricLock();
                    }}
                    className={`w-10 h-5 rounded-full p-0.5 transition ${
                      biometricLockEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition transform ${
                        biometricLockEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Protect confidential balance and income data with Android fingerprint / biometric lock on app resume.
                </p>
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                Status: {biometricLockEnabled ? 'Enabled (Fingerprint / PIN Protected)' : 'Disabled'}
              </span>
            </div>

            {/* Haptic Feedback Tester */}
            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="font-semibold text-white flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-emerald-400" />
                  Tactile Haptics (Vibration)
                </span>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Real Android device haptic pulses for confirmations, budget warnings, and button taps.
                </p>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => haptics.light()}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium transition"
                >
                  Light Tap
                </button>
                <button
                  onClick={() => haptics.success()}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 text-[11px] font-medium transition border border-emerald-500/30"
                >
                  Success Pulse
                </button>
              </div>
            </div>

            {/* Android Device Simulator Toggle */}
            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Android Phone Frame Mode
                </span>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Toggle Google Pixel 8 frame to test the exact Android phone view, status bar, and gesture navigation.
                </p>
              </div>
              <button
                onClick={() => {
                  haptics.medium();
                  setDeviceFrameEnabled(!deviceFrameEnabled);
                }}
                className={`mt-3 w-full py-2 px-3 rounded-xl font-semibold text-xs transition ${
                  deviceFrameEnabled
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {deviceFrameEnabled ? 'Exit Android Phone View' : 'Enable Android Phone View'}
              </button>
            </div>
          </div>
        </div>

        {/* Security & Access Isolation */}
        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Security & Tenant Isolation
          </h4>
          <div className="flex items-start gap-3 p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">Deterministic Tenant Isolation</p>
              <p className="mt-0.5 leading-relaxed">
                Your transactions, budgets, income logs, and assistant queries are secured by JWT token verification. No other user can query or modify your records.
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              haptics.medium();
              logout();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-xl transition border border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
