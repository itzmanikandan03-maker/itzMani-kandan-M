import React, { useState, useEffect } from 'react';
import { Bell, Menu, Plus, Check, Smartphone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAndroid } from '../context/AndroidContext';
import { useHaptics } from '../hooks/useHaptics';
import { recommendationService, NotificationItem } from '../services/recommendationService';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  onOpenAddExpense?: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  onOpenAddExpense,
  title,
}) => {
  const { user } = useAuth();
  const { openInstallModal } = useAndroid();
  const haptics = useHaptics();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    recommendationService.getNotifications().then((res) => {
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    }).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: number) => {
    haptics.light();
    try {
      await recommendationService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-30 select-none text-slate-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            haptics.light();
            onToggleMobileMenu?.();
          }}
          className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden rounded-lg transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Android Install App Header Button */}
        <button
          onClick={() => {
            haptics.medium();
            openInstallModal();
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition cursor-pointer"
          title="Install on Android"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Android App</span>
        </button>

        {onOpenAddExpense && (
          <button
            onClick={() => {
              haptics.medium();
              onOpenAddExpense();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              haptics.light();
              setShowNotifications(!showNotifications);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-white">Notifications</span>
                <span className="text-[11px] text-emerald-400 font-medium">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-slate-500">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 transition ${n.is_read ? 'opacity-50 bg-slate-900' : 'bg-slate-800/40'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-white">{n.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="p-1 text-slate-400 hover:text-emerald-400 rounded transition"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User initials badge */}
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400 select-none">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
