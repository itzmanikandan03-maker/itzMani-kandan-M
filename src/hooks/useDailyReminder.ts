import { useState, useEffect, useCallback, useRef } from 'react';
import { reminderService, DailyReminderSettings, DailyExpenseStatus } from '../services/reminderService';
import { useHaptics } from './useHaptics';

export function useDailyReminder() {
  const haptics = useHaptics();
  const [settings, setSettings] = useState<DailyReminderSettings>({
    enabled: true,
    time: '20:00',
    frequency: 'daily',
    channel: 'browser_and_inapp',
    include_today_spent: true,
    min_spending_alert_enabled: true,
    custom_message: "Time to review today's spending and log any unrecorded expenses!",
  });

  const [status, setStatus] = useState<DailyExpenseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    reminderService.getNotificationPermission()
  );

  const lastTriggeredMinuteRef = useRef<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reminderService.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
      if (res.status) {
        setStatus(res.status);
      } else {
        const statRes = await reminderService.getDailyExpenseStatus();
        if (statRes.success && statRes.data) {
          setStatus(statRes.data);
        }
      }
    } catch {
      // offline or unauthenticated fallback
    } finally {
      setLoading(false);
      setPermission(reminderService.getNotificationPermission());
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to expense creation events to immediately update today's expense status
    const handleExpenseCreated = () => {
      reminderService.getDailyExpenseStatus().then((res) => {
        if (res.success && res.data) {
          setStatus(res.data);
        }
      }).catch(() => {});
    };

    window.addEventListener('expense_created', handleExpenseCreated);
    return () => window.removeEventListener('expense_created', handleExpenseCreated);
  }, [loadData]);

  // Periodic client-side timer checking for scheduled reminder
  useEffect(() => {
    if (!settings.enabled) return;

    const checkInterval = setInterval(async () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const todayDateStr = now.toISOString().split('T')[0];
      const minuteKey = `${todayDateStr}_${currentTime}`;

      if (currentTime === settings.time && lastTriggeredMinuteRef.current !== minuteKey) {
        lastTriggeredMinuteRef.current = minuteKey;

        // Day of week check
        const day = now.getDay();
        const isWeekend = day === 0 || day === 6;
        if (settings.frequency === 'weekdays' && isWeekend) return;
        if (settings.frequency === 'weekends' && !isWeekend) return;

        haptics.warning();

        // Browser push notification if permitted
        if (permission === 'granted' && settings.channel !== 'inapp_only') {
          const body = status?.has_logged_today
            ? `Daily Expense Check: ₹${status.total_spent.toLocaleString('en-IN')} logged today. Any other receipts to record?`
            : "Daily Expense Reminder: You haven't recorded today's spending yet! Keep your ledger clean.";

          reminderService.triggerLocalNotification("⏰ Daily Expense Reminder", {
            body,
            tag: 'daily-expense-reminder',
          });
        }

        // Dispatch window event so in-app listeners / toasts update
        window.dispatchEvent(new CustomEvent('daily_reminder_fired', { detail: { time: currentTime } }));
      }
    }, 30000);

    return () => clearInterval(checkInterval);
  }, [settings, permission, status, haptics]);

  const updateSettings = async (newFields: Partial<DailyReminderSettings>) => {
    try {
      setSaving(true);
      haptics.light();
      const updated = { ...settings, ...newFields };
      setSettings(updated);

      const res = await reminderService.updateSettings(updated);
      if (res.success && res.data) {
        setSettings(res.data);
        haptics.success();
        return true;
      }
      return false;
    } catch {
      haptics.error();
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async () => {
    const nextVal = !settings.enabled;
    return updateSettings({ enabled: nextVal });
  };

  const requestBrowserPermission = async () => {
    haptics.light();
    const result = await reminderService.requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      haptics.success();
      reminderService.triggerLocalNotification("Daily Expense Reminders Active!", {
        body: `You'll be notified daily at ${settings.time} to keep your budget up to date.`,
      });
    }
    return result;
  };

  const sendTestReminder = async () => {
    try {
      setTesting(true);
      haptics.medium();
      const res = await reminderService.sendTestReminder();
      if (res.success) {
        haptics.success();
        setTestResult("Test reminder sent! Check your notification bell and screen.");

        // Also trigger browser notification if allowed
        if (permission === 'granted') {
          const text = status?.has_logged_today
            ? `Test Reminder: ₹${status.total_spent.toLocaleString('en-IN')} logged today across ${status.count} item(s).`
            : "Test Reminder: No expenses recorded today yet. Ready to log!";
          reminderService.triggerLocalNotification("⏰ Test Daily Expense Reminder", {
            body: text,
            tag: 'test-reminder',
          });
        }

        // Dispatch notification reload event
        window.dispatchEvent(new Event('notifications_updated'));

        setTimeout(() => setTestResult(null), 4000);
        return true;
      }
      return false;
    } catch {
      haptics.error();
      setTestResult("Failed to send test reminder");
      setTimeout(() => setTestResult(null), 3000);
      return false;
    } finally {
      setTesting(false);
    }
  };

  return {
    settings,
    status,
    loading,
    saving,
    testing,
    testResult,
    permission,
    updateSettings,
    toggleEnabled,
    requestBrowserPermission,
    sendTestReminder,
    refreshStatus: loadData,
  };
}

export default useDailyReminder;
