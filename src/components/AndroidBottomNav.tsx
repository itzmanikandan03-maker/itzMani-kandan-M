import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Bot, Plus } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface AndroidBottomNavProps {
  onOpenQuickAction: () => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({ onOpenQuickAction }) => {
  const haptics = useHaptics();

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    // Center FAB is rendered separately
    { name: 'Budgets', path: '/budgets', icon: PieChart },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 md:hidden pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 px-3 shadow-2xl">
      <div className="flex items-center justify-around relative">
        {/* Left items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => haptics.light()}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 min-w-[64px] rounded-2xl transition duration-150 relative ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-xl transition ${
                      isActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 w-6 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Center Android Floating Action Button (FAB) */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => {
              haptics.medium();
              onOpenQuickAction();
            }}
            aria-label="Add transaction"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 border-3 border-slate-900 active:scale-95 transition transform hover:brightness-110 cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-semibold text-emerald-400 mt-1 uppercase tracking-wider">
            Quick Add
          </span>
        </div>

        {/* Right items */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => haptics.light()}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 min-w-[64px] rounded-2xl transition duration-150 relative ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-xl transition ${
                      isActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 w-6 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default AndroidBottomNav;
