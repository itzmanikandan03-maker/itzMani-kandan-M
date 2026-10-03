// Resilient Offline Fallback Layer for PocketSmart AI
// Automatically handles requests if the backend is unreachable (static CDN, network error, or offline preview)

export interface OfflineCategory {
  id: number;
  name: string;
  icon: string;
}

export interface OfflineExpense {
  id: number;
  user_id: number;
  category_id: number;
  category_name: string;
  category_icon: string;
  amount: number;
  description: string;
  payment_method: string;
  expense_date: string;
  created_at: string;
}

export interface OfflineIncome {
  id: number;
  user_id: number;
  amount: number;
  source: string;
  date: string;
  description: string;
  created_at: string;
}

export interface OfflineBudget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  month: number;
  year: number;
  category_name?: string;
  category_icon?: string;
  created_at: string;
}

export interface OfflineGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description: string;
  created_at: string;
}

const STORAGE_KEY = 'pocketsmart_offline_db';

const DEFAULT_CATEGORIES: OfflineCategory[] = [
  { id: 1, name: 'Food & Dining', icon: 'Utensils' },
  { id: 2, name: 'Transportation', icon: 'Car' },
  { id: 3, name: 'Shopping', icon: 'ShoppingBag' },
  { id: 4, name: 'Entertainment', icon: 'Film' },
  { id: 5, name: 'Bills & Utilities', icon: 'Zap' },
  { id: 6, name: 'Healthcare', icon: 'Heart' },
  { id: 7, name: 'Education', icon: 'BookOpen' },
  { id: 8, name: 'Housing & Rent', icon: 'Home' },
  { id: 9, name: 'Investment', icon: 'TrendingUp' },
  { id: 10, name: 'Other', icon: 'MoreHorizontal' },
];

function getInitialData() {
  const now = new Date();
  const currYear = now.getFullYear();
  const currMonth = now.getMonth() + 1;
  const yyyyMm = `${currYear}-${String(currMonth).padStart(2, '0')}`;

  return {
    categories: DEFAULT_CATEGORIES,
    incomes: [
      {
        id: 1,
        user_id: 1,
        amount: 75000,
        source: 'Tech Corp Salary',
        date: `${yyyyMm}-01`,
        description: 'Primary monthly corporate salary',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        user_id: 1,
        amount: 15000,
        source: 'Freelance UI Consulting',
        date: `${yyyyMm}-12`,
        description: 'Fintech Dashboard Design milestone',
        created_at: new Date().toISOString(),
      },
    ],
    budgets: [
      { id: 1, user_id: 1, category_id: 1, amount: 8000, month: currMonth, year: currYear, created_at: new Date().toISOString() },
      { id: 2, user_id: 1, category_id: 8, amount: 25000, month: currMonth, year: currYear, created_at: new Date().toISOString() },
      { id: 3, user_id: 1, category_id: 3, amount: 5000, month: currMonth, year: currYear, created_at: new Date().toISOString() },
      { id: 4, user_id: 1, category_id: 2, amount: 4000, month: currMonth, year: currYear, created_at: new Date().toISOString() },
      { id: 5, user_id: 1, category_id: 5, amount: 4500, month: currMonth, year: currYear, created_at: new Date().toISOString() },
      { id: 6, user_id: 1, category_id: 4, amount: 3500, month: currMonth, year: currYear, created_at: new Date().toISOString() },
    ],
    expenses: [
      {
        id: 1,
        user_id: 1,
        category_id: 8,
        category_name: 'Housing & Rent',
        category_icon: 'Home',
        amount: 25000,
        description: 'Monthly Apartment Rent',
        payment_method: 'Bank Transfer',
        expense_date: `${yyyyMm}-02`,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        user_id: 1,
        category_id: 5,
        category_name: 'Bills & Utilities',
        category_icon: 'Zap',
        amount: 2200,
        description: 'Electricity & Fiber Internet Bill',
        payment_method: 'UPI',
        expense_date: `${yyyyMm}-05`,
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        user_id: 1,
        category_id: 1,
        category_name: 'Food & Dining',
        category_icon: 'Utensils',
        amount: 3400,
        description: 'Supermarket Groceries & Supplies',
        payment_method: 'Credit Card',
        expense_date: `${yyyyMm}-06`,
        created_at: new Date().toISOString(),
      },
      {
        id: 4,
        user_id: 1,
        category_id: 2,
        category_name: 'Transportation',
        category_icon: 'Car',
        amount: 1400,
        description: 'Fuel Refill & Metro Card',
        payment_method: 'UPI',
        expense_date: `${yyyyMm}-08`,
        created_at: new Date().toISOString(),
      },
      {
        id: 5,
        user_id: 1,
        category_id: 3,
        category_name: 'Shopping',
        category_icon: 'ShoppingBag',
        amount: 5800,
        description: 'Amazon Ergonomic Chair & Running Shoes',
        payment_method: 'Credit Card',
        expense_date: `${yyyyMm}-14`,
        created_at: new Date().toISOString(),
      },
      {
        id: 6,
        user_id: 1,
        category_id: 4,
        category_name: 'Entertainment',
        category_icon: 'Film',
        amount: 1850,
        description: 'Movie IMAX Tickets & Weekend Dinner',
        payment_method: 'Debit Card',
        expense_date: `${yyyyMm}-18`,
        created_at: new Date().toISOString(),
      },
    ],
    savings_goals: [
      {
        id: 1,
        user_id: 1,
        name: 'Emergency Fund',
        target_amount: 150000,
        current_amount: 95000,
        target_date: `${currYear + 1}-03-31`,
        description: '6 months living expenses reserve fund',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        user_id: 1,
        name: 'MacBook Pro M4',
        target_amount: 120000,
        current_amount: 72000,
        target_date: `${currYear}-12-15`,
        description: 'Development machine replacement upgrade',
        created_at: new Date().toISOString(),
      },
    ],
    notifications: [
      {
        id: 1,
        user_id: 1,
        title: 'Budget Alert: Shopping Exceeded',
        message: 'You have spent ₹5,800 on Shopping against a ₹5,000 budget (116% utilized).',
        type: 'warning',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        user_id: 1,
        title: '⏰ Daily Expense Reminder',
        message: "Time to review today's spending and log any unrecorded expenses!",
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ],
    reminder_settings: {
      enabled: true,
      time: '20:00',
      frequency: 'daily',
      channel: 'browser_and_inapp',
      include_today_spent: true,
      min_spending_alert_enabled: true,
      custom_message: "Time to review today's spending and log any unrecorded expenses!",
    },
    nextIds: {
      expenses: 10,
      incomes: 5,
      budgets: 10,
      savings_goals: 5,
      notifications: 5,
    },
  };
}

export function getOfflineDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  const init = getInitialData();
  saveOfflineDb(init);
  return init;
}

export function saveOfflineDb(data: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export async function handleOfflineRequest(url: string, method: string, data?: any, params?: any): Promise<any> {
  const db = getOfflineDb();
  const normalizedUrl = url.replace(/^\/?api\/?/, '/');
  const now = new Date();
  const currYear = now.getFullYear();
  const currMonth = now.getMonth() + 1;
  const yyyyMm = `${currYear}-${String(currMonth).padStart(2, '0')}`;

  // Helper response wrapper
  const ok = (payload: any, message = 'Success') => ({
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data: { success: true, data: payload, message },
  });

  // Health check
  if (normalizedUrl === '/health') {
    return ok({ status: 'healthy', service: 'PocketSmart AI (Resilient)', version: '1.0.0' });
  }

  // Auth routes
  if (normalizedUrl === '/auth/login' || normalizedUrl === '/auth/register') {
    const user = {
      id: 1,
      name: data?.name || 'Alex Sharma',
      email: data?.email || 'demo@pocketsmart.ai',
      created_at: new Date().toISOString(),
    };
    const token = 'offline_pocketsmart_token_' + Date.now();
    localStorage.setItem('pocketsmart_token', token);
    localStorage.setItem('pocketsmart_user', JSON.stringify(user));
    return ok({ token, user }, 'Login successful');
  }

  if (normalizedUrl === '/auth/me') {
    const raw = localStorage.getItem('pocketsmart_user');
    const user = raw ? JSON.parse(raw) : { id: 1, name: 'Alex Sharma', email: 'demo@pocketsmart.ai' };
    return ok({ user });
  }

  if (normalizedUrl === '/auth/logout') {
    localStorage.removeItem('pocketsmart_token');
    localStorage.removeItem('pocketsmart_user');
    return ok(null, 'Logged out');
  }

  // Dashboard route
  if (normalizedUrl === '/dashboard') {
    const totalIncome = db.incomes.reduce((sum: number, i: any) => sum + i.amount, 0);
    const totalExpenses = db.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const remainingBalance = totalIncome - totalExpenses;
    const savings = Math.max(0, remainingBalance);
    const savingsPercentage = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
    const totalBudget = db.budgets.reduce((sum: number, b: any) => sum + b.amount, 0);
    const budgetUtilization = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

    const categoryMap: Record<string, { category_name: string; category_icon: string; total_spent: number; budget_amount: number }> = {};
    for (const cat of db.categories) {
      categoryMap[cat.name] = {
        category_name: cat.name,
        category_icon: cat.icon,
        total_spent: 0,
        budget_amount: 0,
      };
    }
    for (const b of db.budgets) {
      const cat = db.categories.find((c: any) => c.id === b.category_id);
      if (cat && categoryMap[cat.name]) {
        categoryMap[cat.name].budget_amount += b.amount;
      }
    }
    for (const e of db.expenses) {
      const catName = e.category_name || 'Other';
      if (!categoryMap[catName]) {
        categoryMap[catName] = { category_name: catName, category_icon: e.category_icon || 'MoreHorizontal', total_spent: 0, budget_amount: 0 };
      }
      categoryMap[catName].total_spent += e.amount;
    }

    const categoryBreakdown = Object.values(categoryMap)
      .filter((c) => c.total_spent > 0 || c.budget_amount > 0)
      .map((c) => ({
        ...c,
        percentage_of_total: totalExpenses > 0 ? Math.round((c.total_spent / totalExpenses) * 100) : 0,
        budget_utilization: c.budget_amount > 0 ? Math.round((c.total_spent / c.budget_amount) * 100) : 0,
        status: c.budget_amount === 0 ? 'Normal' : c.total_spent > c.budget_amount ? 'Exceeded' : c.total_spent >= c.budget_amount * 0.8 ? 'Warning' : 'Normal',
      }));

    return ok({
      summary: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        remaining_balance: remainingBalance,
        savings,
        savings_percentage: savingsPercentage,
        total_budget: totalBudget,
        budget_utilization: budgetUtilization,
      },
      category_breakdown: categoryBreakdown,
      recent_expenses: db.expenses.slice(-5).reverse(),
      budget_alerts: db.notifications.filter((n: any) => n.type === 'warning'),
    });
  }

  // Categories
  if (normalizedUrl === '/categories') {
    return ok(db.categories);
  }

  // Expenses CRUD
  if (normalizedUrl === '/expenses' && method.toUpperCase() === 'GET') {
    let list = [...db.expenses];
    if (params?.category_id) {
      list = list.filter((e) => e.category_id === Number(params.category_id));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((e) => e.description.toLowerCase().includes(q));
    }
    return ok(list.reverse());
  }

  if (normalizedUrl === '/expenses' && method.toUpperCase() === 'POST') {
    const cat = db.categories.find((c: any) => c.id === data.category_id) || db.categories[0];
    const newExp: OfflineExpense = {
      id: db.nextIds.expenses++,
      user_id: 1,
      category_id: cat.id,
      category_name: cat.name,
      category_icon: cat.icon,
      amount: Number(data.amount) || 0,
      description: data.description || 'Expense',
      payment_method: data.payment_method || 'UPI',
      expense_date: data.expense_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };
    db.expenses.push(newExp);
    saveOfflineDb(db);
    return ok(newExp, 'Expense added successfully');
  }

  if (normalizedUrl.startsWith('/expenses/') && method.toUpperCase() === 'DELETE') {
    const id = Number(normalizedUrl.split('/')[2]);
    db.expenses = db.expenses.filter((e: any) => e.id !== id);
    saveOfflineDb(db);
    return ok({ id }, 'Expense deleted');
  }

  // Budgets CRUD
  if (normalizedUrl === '/budgets' && method.toUpperCase() === 'GET') {
    const enriched = db.budgets.map((b: any) => {
      const cat = db.categories.find((c: any) => c.id === b.category_id);
      const spent = db.expenses
        .filter((e: any) => e.category_id === b.category_id)
        .reduce((sum: number, e: any) => sum + e.amount, 0);
      return {
        ...b,
        category_name: cat?.name || 'Category',
        category_icon: cat?.icon || 'Tag',
        spent_amount: spent,
        utilization_percentage: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
        status: spent > b.amount ? 'Exceeded' : spent >= b.amount * 0.8 ? 'Warning' : 'Normal',
      };
    });
    return ok(enriched);
  }

  if (normalizedUrl === '/budgets' && method.toUpperCase() === 'POST') {
    const cat = db.categories.find((c: any) => c.id === data.category_id);
    const newB: OfflineBudget = {
      id: db.nextIds.budgets++,
      user_id: 1,
      category_id: data.category_id,
      amount: Number(data.amount),
      month: data.month || currMonth,
      year: data.year || currYear,
      category_name: cat?.name,
      category_icon: cat?.icon,
      created_at: new Date().toISOString(),
    };
    db.budgets.push(newB);
    saveOfflineDb(db);
    return ok(newB, 'Budget set successfully');
  }

  // Incomes CRUD
  if (normalizedUrl === '/income' && method.toUpperCase() === 'GET') {
    return ok(db.incomes);
  }

  if (normalizedUrl === '/income' && method.toUpperCase() === 'POST') {
    const newInc: OfflineIncome = {
      id: db.nextIds.incomes++,
      user_id: 1,
      amount: Number(data.amount),
      source: data.source || 'Income',
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || '',
      created_at: new Date().toISOString(),
    };
    db.incomes.push(newInc);
    saveOfflineDb(db);
    return ok(newInc, 'Income added successfully');
  }

  // Savings Goals
  if (normalizedUrl === '/savings-goals' && method.toUpperCase() === 'GET') {
    return ok(db.savings_goals);
  }

  if (normalizedUrl === '/savings-goals' && method.toUpperCase() === 'POST') {
    const newG: OfflineGoal = {
      id: db.nextIds.savings_goals++,
      user_id: 1,
      name: data.name,
      target_amount: Number(data.target_amount),
      current_amount: Number(data.current_amount) || 0,
      target_date: data.target_date,
      description: data.description || '',
      created_at: new Date().toISOString(),
    };
    db.savings_goals.push(newG);
    saveOfflineDb(db);
    return ok(newG, 'Savings goal created');
  }

  if (normalizedUrl.startsWith('/savings-goals/') && method.toUpperCase() === 'PUT') {
    const id = Number(normalizedUrl.split('/')[2]);
    const goal = db.savings_goals.find((g: any) => g.id === id);
    if (goal) {
      if (data.add_amount) goal.current_amount += Number(data.add_amount);
      if (data.current_amount !== undefined) goal.current_amount = Number(data.current_amount);
      if (data.name) goal.name = data.name;
      saveOfflineDb(db);
      return ok(goal, 'Goal updated');
    }
  }

  // Daily Expense Reminder Settings
  if (normalizedUrl === '/user/reminder-settings') {
    if (method.toUpperCase() === 'PUT' && data) {
      db.reminder_settings = { ...db.reminder_settings, ...data };
      saveOfflineDb(db);
      return ok(db.reminder_settings, 'Settings updated');
    }
    return ok(db.reminder_settings);
  }

  if (normalizedUrl === '/user/daily-expense-status') {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpenses = db.expenses.filter((e: any) => e.expense_date === todayStr);
    const spentToday = todayExpenses.reduce((s: number, e: any) => s + e.amount, 0);
    return ok({
      date: todayStr,
      count: todayExpenses.length,
      total_spent: spentToday,
      has_logged_today: todayExpenses.length > 0,
      category_breakdown: [],
      reminder_settings: db.reminder_settings,
      prompt_message: todayExpenses.length > 0
        ? `You've logged ${todayExpenses.length} expense(s) totaling ₹${spentToday.toLocaleString('en-IN')} today.`
        : "You haven't recorded any expenses today yet.",
    });
  }

  if (normalizedUrl === '/user/reminder-test') {
    const notif = {
      id: Date.now(),
      user_id: 1,
      title: '⏰ Test Daily Expense Reminder',
      message: 'Time to review today’s spending and log any unrecorded receipts!',
      type: 'info',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    db.notifications.unshift(notif);
    saveOfflineDb(db);
    return ok({ notification: notif }, 'Daily expense reminder sent!');
  }

  // Notifications
  if (normalizedUrl === '/notifications') {
    return ok(db.notifications);
  }

  if (normalizedUrl.startsWith('/notifications/') && method.toUpperCase() === 'PUT') {
    const id = Number(normalizedUrl.split('/')[2]);
    const n = db.notifications.find((notif: any) => notif.id === id);
    if (n) n.is_read = true;
    saveOfflineDb(db);
    return ok(n, 'Notification marked as read');
  }

  // Analytics endpoints
  if (normalizedUrl.startsWith('/analytics/')) {
    const totalIncome = db.incomes.reduce((sum: number, i: any) => sum + i.amount, 0);
    const totalExpenses = db.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    return ok({
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_savings: totalIncome - totalExpenses,
      savings_rate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
      daily_average: Math.round(totalExpenses / Math.max(1, new Date().getDate())),
      projected_monthly: Math.round((totalExpenses / Math.max(1, new Date().getDate())) * 30),
      chart_data: [
        { month: 'Last Month', income: 75000, expenses: 38000, savings: 37000 },
        { month: 'This Month', income: totalIncome, expenses: totalExpenses, savings: totalIncome - totalExpenses },
      ],
    });
  }

  // Recommendations
  if (normalizedUrl === '/recommendations') {
    return ok([
      {
        id: 1,
        title: 'High Shopping Utilization',
        description: 'Shopping category exceeds 100% of budgeted threshold. Limit non-essential purchases for the rest of this month.',
        type: 'warning',
        impact_amount: 800,
        is_read: false,
      },
      {
        id: 2,
        title: 'Consistent Income Allocation',
        description: 'Your corporate salary was credited on the 1st. Great time to transfer ₹15,000 directly to Emergency Fund.',
        type: 'tip',
        impact_amount: 15000,
        is_read: false,
      },
    ]);
  }

  // AI Assistant fallback
  if (normalizedUrl === '/assistant/query') {
    const query = data?.query?.toLowerCase() || '';
    let response = "I've reviewed your financial ledger. Your current monthly income is ₹90,000 and total spending is ₹39,650, leaving you with ₹50,350 in savings.";
    if (query.includes('shopping') || query.includes('budget')) {
      response = "You have currently exceeded your Shopping budget by ₹800 (116% utilization). All other categories are within healthy limits.";
    } else if (query.includes('save') || query.includes('goal')) {
      response = "Your Emergency Fund is at ₹95,000 of your ₹150,000 goal (63% achieved). You are on track to complete it by March.";
    }
    return ok({ answer: response, sources: ['Local Financial Ledger'] });
  }

  return ok({}, 'Success');
}
