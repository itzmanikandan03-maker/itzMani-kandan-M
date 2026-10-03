import api from './api';

export interface DailyReminderSettings {
  enabled: boolean;
  time: string; // e.g. "20:00"
  frequency: 'daily' | 'weekdays' | 'weekends';
  channel: 'browser_and_inapp' | 'inapp_only' | 'browser_only';
  include_today_spent: boolean;
  min_spending_alert_enabled: boolean;
  custom_message: string;
  last_triggered_at?: string;
  last_triggered_date?: string;
}

export interface DailyExpenseStatus {
  date: string;
  count: number;
  total_spent: number;
  has_logged_today: boolean;
  category_breakdown: Array<{ category: string; spent: number }>;
  reminder_settings: DailyReminderSettings;
  prompt_message: string;
}

export interface ReminderApiResponse {
  success: boolean;
  data: DailyReminderSettings;
  status?: DailyExpenseStatus;
  server_time?: string;
  message?: string;
}

export const reminderService = {
  async getSettings(): Promise<ReminderApiResponse> {
    const res = await api.get('/user/reminder-settings');
    return res.data;
  },

  async updateSettings(settings: Partial<DailyReminderSettings>): Promise<ReminderApiResponse> {
    const res = await api.put('/user/reminder-settings', settings);
    return res.data;
  },

  async getDailyExpenseStatus(date?: string): Promise<{ success: boolean; data: DailyExpenseStatus }> {
    const res = await api.get('/user/daily-expense-status', {
      params: date ? { date } : undefined,
    });
    return res.data;
  },

  async sendTestReminder(): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await api.post('/user/reminder-test');
    return res.data;
  },

  // Check if browser notifications are supported
  isNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  // Get current permission status
  getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (!this.isNotificationSupported()) return 'unsupported';
    return Notification.permission;
  },

  // Request browser notification permission
  async requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isNotificationSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return Notification.permission;
    }
  },

  // Trigger local or system notification
  async triggerLocalNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (!this.isNotificationSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            ...options,
          });
          return true;
        }
      }

      // Fallback to standard window Notification
      new Notification(title, {
        icon: '/favicon.svg',
        ...options,
      });
      return true;
    } catch {
      return false;
    }
  },
};

export default reminderService;
