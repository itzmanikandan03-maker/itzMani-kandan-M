import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  ArrowDownLeft,
  PieChart,
  BarChart3,
  Target,
  Sparkles,
  User,
  LogOut,
  Wallet,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAndroid } from '../context/AndroidContext';
import { useHaptics } from '../hooks/useHaptics';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { openInstallModal } = useAndroid();
  const haptics = useHaptics();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/income', label: 'Income', icon: ArrowDownLeft },
    { to: '/budgets', label: 'Budgets', icon: PieChart },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/savings-goals', label: 'Savings Goals', icon: Target },
    { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col h-full shrink-0 select-none text-slate-200">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
          <Wallet className="w-4 h-4" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-white block leading-tight">
            PocketSmart
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
            Android Edition
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                haptics.light();
                onCloseMobile?.();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Android Install App Card */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={() => {
            haptics.medium();
            openInstallModal();
          }}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/50 to-slate-800/60 border border-emerald-500/20 hover:border-emerald-500/40 text-left transition flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-[11px] font-semibold text-emerald-300 block leading-tight">
              Android App
            </span>
            <span className="text-[10px] text-slate-400 block leading-tight">
              Install APK / PWA
            </span>
          </div>
        </button>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between p-1.5 rounded-lg">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              haptics.light();
              logout();
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
