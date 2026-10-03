import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'pocketsmart_super_secure_jwt_secret_change_in_prod';
const DATA_FILE = path.join(__dirname, 'data', 'store.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

export interface DailyReminderSettings {
  enabled: boolean;
  time: string; // "20:00"
  frequency: 'daily' | 'weekdays' | 'weekends';
  channel: 'browser_and_inapp' | 'inapp_only' | 'browser_only';
  include_today_spent: boolean;
  min_spending_alert_enabled: boolean;
  custom_message: string;
  last_triggered_at?: string;
  last_triggered_date?: string;
}

// Interfaces
interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  reminder_settings?: DailyReminderSettings;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  created_at: string;
}

interface Income {
  id: number;
  user_id: number;
  amount: number;
  source: string;
  date: string;
  description: string;
  created_at: string;
}

interface Expense {
  id: number;
  user_id: number;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  amount: number;
  description: string;
  payment_method: string;
  expense_date: string;
  created_at: string;
}

interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
}

interface SavingsGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description: string;
  created_at: string;
}

interface Recommendation {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  created_at: string;
}

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  categories: Category[];
  incomes: Income[];
  expenses: Expense[];
  budgets: Budget[];
  savings_goals: SavingsGoal[];
  recommendations: Recommendation[];
  notifications: Notification[];
  nextIds: {
    users: number;
    categories: number;
    incomes: number;
    expenses: number;
    budgets: number;
    savings_goals: number;
    recommendations: number;
    notifications: number;
  };
}

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Food", icon: "Utensils", created_at: new Date().toISOString() },
  { id: 2, name: "Transport", icon: "Car", created_at: new Date().toISOString() },
  { id: 3, name: "Shopping", icon: "ShoppingBag", created_at: new Date().toISOString() },
  { id: 4, name: "Entertainment", icon: "Film", created_at: new Date().toISOString() },
  { id: 5, name: "Bills", icon: "Receipt", created_at: new Date().toISOString() },
  { id: 6, name: "Education", icon: "GraduationCap", created_at: new Date().toISOString() },
  { id: 7, name: "Healthcare", icon: "HeartPulse", created_at: new Date().toISOString() },
  { id: 8, name: "Rent", icon: "Home", created_at: new Date().toISOString() },
  { id: 9, name: "Savings", icon: "PiggyBank", created_at: new Date().toISOString() },
  { id: 10, name: "Other", icon: "Tag", created_at: new Date().toISOString() },
];

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      // fallback
    }
  }

  const initialDb: DatabaseSchema = {
    users: [],
    categories: [...DEFAULT_CATEGORIES],
    incomes: [],
    expenses: [],
    budgets: [],
    savings_goals: [],
    recommendations: [],
    notifications: [],
    nextIds: {
      users: 1,
      categories: 11,
      incomes: 1,
      expenses: 1,
      budgets: 1,
      savings_goals: 1,
      recommendations: 1,
      notifications: 1,
    }
  };

  saveDatabase(initialDb);
  seedDemoData(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function seedDemoData(db: DatabaseSchema) {
  const demoEmail = "demo@pocketsmart.ai";
  let demoUser = db.users.find(u => u.email === demoEmail);
  if (!demoUser) {
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync("Demo@123", salt);
    demoUser = {
      id: db.nextIds.users++,
      name: "Alex Sharma",
      email: demoEmail,
      password_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.users.push(demoUser);

    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth() + 1;
    const yyyyMm = `${currYear}-${String(currMonth).padStart(2, '0')}`;

    // Seed income
    db.incomes.push(
      {
        id: db.nextIds.incomes++,
        user_id: demoUser.id,
        amount: 75000,
        source: "Tech Corp Salary",
        date: `${yyyyMm}-01`,
        description: "Primary monthly corporate salary",
        created_at: new Date().toISOString(),
      },
      {
        id: db.nextIds.incomes++,
        user_id: demoUser.id,
        amount: 15000,
        source: "Freelance UI Consulting",
        date: `${yyyyMm}-12`,
        description: "Fintech Dashboard Design milestone",
        created_at: new Date().toISOString(),
      }
    );

    // Seed budgets
    db.budgets.push(
      { id: db.nextIds.budgets++, user_id: demoUser.id, category_id: 1, amount: 8000, month: currMonth, year: currYear, created_at: new Date().toISOString() }, // Food
      { id: db.nextIds.budgets++, user_id: demoUser.id, category_id: 8, amount: 25000, month: currMonth, year: currYear, created_at: new Date().toISOString() }, // Rent
      { id: db.nextIds.budgets++, user_id: demoUser.id, category_id: 3, amount: 5000, month: currMonth, year: currYear, created_at: new Date().toISOString() }, // Shopping
      { id: db.nextIds.budgets++, user_id: demoUser.id, category_id: 2, amount: 4000, month: currMonth, year: currYear, created_at: new Date().toISOString() }, // Transport
      { id: db.nextIds.budgets++, user_id: demoUser.id, category_id: 5, amount: 4500, month: currMonth, year: currYear, created_at: new Date().toISOString() }, // Bills
      { id: db.nextIds.budgets++, user_id: demoUser.id, category_id: 4, amount: 3500, month: currMonth, year: currYear, created_at: new Date().toISOString() }, // Entertainment
    );

    // Seed expenses
    db.expenses.push(
      {
        id: db.nextIds.expenses++,
        user_id: demoUser.id,
        category_id: 8,
        amount: 25000,
        description: "Monthly Apartment Rent",
        payment_method: "Bank Transfer",
        expense_date: `${yyyyMm}-02`,
        created_at: new Date().toISOString(),
      },
      {
        id: db.nextIds.expenses++,
        user_id: demoUser.id,
        category_id: 5,
        amount: 2200,
        description: "Electricity & Fiber Internet Bill",
        payment_method: "UPI",
        expense_date: `${yyyyMm}-05`,
        created_at: new Date().toISOString(),
      },
      {
        id: db.nextIds.expenses++,
        user_id: demoUser.id,
        category_id: 1,
        amount: 3400,
        description: "Supermarket Groceries & Supplies",
        payment_method: "Credit Card",
        expense_date: `${yyyyMm}-06`,
        created_at: new Date().toISOString(),
      },
      {
        id: db.nextIds.expenses++,
        user_id: demoUser.id,
        category_id: 2,
        amount: 1400,
        description: "Fuel Refill & Metro Card",
        payment_method: "UPI",
        expense_date: `${yyyyMm}-08`,
        created_at: new Date().toISOString(),
      },
      {
        id: db.nextIds.expenses++,
        user_id: demoUser.id,
        category_id: 3,
        amount: 5800, // Exceeds Shopping budget of 5000!
        description: "Amazon Ergonomic Chair & Running Shoes",
        payment_method: "Credit Card",
        expense_date: `${yyyyMm}-14`,
        created_at: new Date().toISOString(),
      },
      {
        id: db.nextIds.expenses++,
        user_id: demoUser.id,
        category_id: 1,
        amount: 4100, // Brings Food to 7500 / 8000 -> 93.7% warning!
        description: "Team Dinner & Dessert",
        payment_method: "Debit Card",
        expense_date: `${yyyyMm}-18`,
        created_at: new Date().toISOString(),
      },
      {
        id: db.nextIds.expenses++,
        user_id: demoUser.id,
        category_id: 4,
        amount: 1200,
        description: "IMAX Movie Tickets & Snacks",
        payment_method: "UPI",
        expense_date: `${yyyyMm}-21`,
        created_at: new Date().toISOString(),
      }
    );

    // Seed savings goals
    db.savings_goals.push(
      {
        id: db.nextIds.savings_goals++,
        user_id: demoUser.id,
        name: "MacBook Pro M3 Max",
        target_amount: 150000,
        current_amount: 95000,
        target_date: `${currYear}-12-31`,
        description: "High performance workstation for coding",
        created_at: new Date().toISOString(),
      },
      {
        id: db.nextIds.savings_goals++,
        user_id: demoUser.id,
        name: "Emergency Reserve Fund",
        target_amount: 200000,
        current_amount: 140000,
        target_date: `${currYear + 1}-06-30`,
        description: "6 months liquid emergency buffer",
        created_at: new Date().toISOString(),
      },
      {
        id: db.nextIds.savings_goals++,
        user_id: demoUser.id,
        name: "Japan Vacation",
        target_amount: 120000,
        current_amount: 40000,
        target_date: `${currYear + 1}-03-15`,
        description: "Tokyo & Kyoto 2-week itinerary",
        created_at: new Date().toISOString(),
      }
    );

    // Seed notifications
    db.notifications.push(
      {
        id: db.nextIds.notifications++,
        user_id: demoUser.id,
        title: "Budget Exceeded: Shopping",
        message: "Your Shopping spending is ₹800.00 above your monthly budget.",
        type: "alert",
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: db.nextIds.notifications++,
        user_id: demoUser.id,
        title: "Budget Alert: Food",
        message: "Your Food budget is almost exhausted (93.8% used, ₹500.00 remaining).",
        type: "warning",
        is_read: false,
        created_at: new Date().toISOString(),
      }
    );

    saveDatabase(db);
  }
}

const dbInstance = loadDatabase();

// Keyword Categorization Service
const KEYWORD_MAP: Record<string, string[]> = {
  Food: ["food", "pizza", "burger", "dinner", "lunch", "breakfast", "restaurant", "cafe", "coffee", "starbucks", "swiggy", "zomato", "groceries", "supermarket", "bakery", "snack", "tea", "mcdonalds", "kfc", "dominos", "subway", "meal", "fruits", "vegetables", "milk"],
  Transport: ["uber", "ola", "cab", "taxi", "metro", "bus", "train", "fuel", "petrol", "diesel", "flight", "airfare", "parking", "toll", "auto", "railway", "commute", "gas station"],
  Shopping: ["amazon", "flipkart", "shoes", "clothes", "dress", "mall", "electronics", "myntra", "zara", "h&m", "purchase", "apparel", "gadget", "laptop", "mobile", "headphone", "order", "store"],
  Entertainment: ["movie", "ticket", "cinema", "netflix", "prime", "hotstar", "spotify", "concert", "game", "gaming", "theatre", "show", "amusement", "party", "club", "outing", "disney"],
  Bills: ["bill", "electricity", "water", "wifi", "internet", "broadband", "mobile recharge", "dth", "utility", "gas bill", "phone bill", "maintenance", "power", "postpaid"],
  Education: ["fee", "tuition", "course", "udemy", "coursera", "books", "stationery", "exam", "school", "university", "seminar", "workshop", "tutorial"],
  Healthcare: ["medicine", "doctor", "hospital", "clinic", "pharmacy", "medical", "checkup", "dental", "dentist", "prescription", "lab", "test", "health"],
  Rent: ["rent", "house rent", "flat rent", "pg", "hostel", "room rent", "lease"],
  Savings: ["savings", "investment", "deposit", "mutual fund", "sip", "stocks", "fixed deposit", "emergency fund", "ppf", "gold"],
};

function predictCategory(desc: string): string {
  if (!desc) return "Other";
  const lower = desc.toLowerCase();
  for (const [cat, kws] of Object.entries(KEYWORD_MAP)) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        return cat;
      }
    }
  }
  return "Other";
}

// Auth Middleware
interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Authorization header missing or invalid" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Token is invalid or expired" });
    }
    req.user = user;
    next();
  });
}

// Recommendation Generator
function generateUserRecommendations(userId: number) {
  const now = new Date();
  const currMonth = now.getMonth() + 1;
  const currYear = now.getFullYear();

  const userIncomes = dbInstance.incomes.filter(i => {
    const d = new Date(i.date);
    return i.user_id === userId && (d.getMonth() + 1) === currMonth && d.getFullYear() === currYear;
  });
  const totalIncome = userIncomes.reduce((sum, i) => sum + i.amount, 0);

  const userExpenses = dbInstance.expenses.filter(e => {
    const d = new Date(e.expense_date);
    return e.user_id === userId && (d.getMonth() + 1) === currMonth && d.getFullYear() === currYear;
  });
  const totalExpense = userExpenses.reduce((sum, e) => sum + e.amount, 0);

  const userBudgets = dbInstance.budgets.filter(b => b.user_id === userId && b.month === currMonth && b.year === currYear);

  // Group expenses by category
  const catSpent: Record<number, number> = {};
  for (const e of userExpenses) {
    catSpent[e.category_id] = (catSpent[e.category_id] || 0) + e.amount;
  }

  const generated: { type: string; title: string; message: string; priority: string }[] = [];

  // 1. Budget rules
  for (const b of userBudgets) {
    const spent = catSpent[b.category_id] || 0;
    const cat = dbInstance.categories.find(c => c.id === b.category_id);
    const catName = cat ? cat.name : "Category";

    if (spent > b.amount) {
      const over = (spent - b.amount).toFixed(2);
      generated.push({
        type: "budget_exceeded",
        title: `Budget Exceeded: ${catName}`,
        message: `Your ${catName} spending is ₹${Number(over).toLocaleString('en-IN')} above your monthly budget. Consider curtailing discretionary purchases in this category.`,
        priority: "high"
      });
    } else if (spent >= (0.80 * b.amount)) {
      const pct = Math.round((spent / b.amount) * 100);
      const remaining = (b.amount - spent).toFixed(2);
      generated.push({
        type: "budget_warning",
        title: `Budget Alert: ${catName}`,
        message: `Your ${catName} budget is almost exhausted (${pct}% used, ₹${Number(remaining).toLocaleString('en-IN')} remaining).`,
        priority: "medium"
      });
    }
  }

  // 2. Highest Spending
  let topCatId: number | null = null;
  let topAmount = 0;
  for (const [catIdStr, amt] of Object.entries(catSpent)) {
    if (amt > topAmount) {
      topAmount = amt;
      topCatId = Number(catIdStr);
    }
  }

  if (topCatId && totalExpense > 0) {
    const cat = dbInstance.categories.find(c => c.id === topCatId);
    const catName = cat ? cat.name : "Top Category";
    const pct = Math.round((topAmount / totalExpense) * 100);
    if (pct >= 30) {
      generated.push({
        type: "highest_spending",
        title: `Major Expense Area: ${catName}`,
        message: `${catName} represents ${pct}% (₹${topAmount.toLocaleString('en-IN')}) of your overall monthly spending.`,
        priority: pct >= 50 ? "high" : "medium"
      });
    }
  }

  // 3. Savings Rate
  if (totalIncome > 0) {
    const savings = totalIncome - totalExpense;
    const rate = Math.round((savings / totalIncome) * 100);
    if (savings < 0) {
      generated.push({
        type: "negative_cashflow",
        title: "Monthly Cashflow Deficit",
        message: `Your spending exceeds your income by ₹${Math.abs(savings).toLocaleString('en-IN')}. Focus on core essentials to restore positive savings.`,
        priority: "high"
      });
    } else if (rate < 15) {
      generated.push({
        type: "low_savings",
        title: "Low Savings Rate",
        message: `Your current savings rate is ${rate}%. Strive for at least 20% to fortify your emergency reserves.`,
        priority: "medium"
      });
    } else if (rate >= 30) {
      generated.push({
        type: "healthy_savings",
        title: "Excellent Savings Discipline",
        message: `Great job! You are saving ${rate}% of your income. Consider allocating extra surplus toward your savings goals.`,
        priority: "low"
      });
    }
  }

  // Persist new recommendations
  for (const rec of generated) {
    const exists = dbInstance.recommendations.find(r => r.user_id === userId && r.type === rec.type && r.title === rec.title && !r.is_read);
    if (!exists) {
      dbInstance.recommendations.push({
        id: dbInstance.nextIds.recommendations++,
        user_id: userId,
        type: rec.type,
        title: rec.title,
        message: rec.message,
        priority: rec.priority,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }
  }
  saveDatabase(dbInstance);
}

// Prediction Calculator
function calculatePrediction(userId: number, currentExpenses: number, monthlyBudget: number) {
  const now = new Date();
  const day = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  const daysElapsed = Math.max(day, 1);
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 0);

  let dailyAvg = 0;
  let predictedMonthly = 0;

  if (currentExpenses > 0) {
    dailyAvg = Math.round((currentExpenses / daysElapsed) * 100) / 100;
    predictedMonthly = Math.round(dailyAvg * daysInMonth * 100) / 100;
  }

  const budgetDiff = monthlyBudget > 0 ? Math.round((monthlyBudget - predictedMonthly) * 100) / 100 : 0;
  const isOverBudget = monthlyBudget > 0 && predictedMonthly > monthlyBudget;

  return {
    days_elapsed: daysElapsed,
    days_in_month: daysInMonth,
    days_remaining: daysRemaining,
    current_expenses: currentExpenses,
    daily_average: dailyAvg,
    predicted_monthly_expense: predictedMonthly,
    monthly_budget: monthlyBudget,
    budget_difference: budgetDiff,
    is_over_budget_projected: isOverBudget,
    projected_overspend: isOverBudget ? Math.round((predictedMonthly - monthlyBudget) * 100) / 100 : 0,
    budget_utilization_projected: monthlyBudget > 0 ? Math.round((predictedMonthly / monthlyBudget) * 1000) / 10 : 0,
    confidence: daysElapsed >= 7 ? "high" : daysElapsed >= 3 ? "medium" : "early_month_estimate"
  };
}

// Daily Expense Reminder Helpers
function getDefaultReminderSettings(enabled = true): DailyReminderSettings {
  return {
    enabled,
    time: "20:00",
    frequency: 'daily',
    channel: 'browser_and_inapp',
    include_today_spent: true,
    min_spending_alert_enabled: true,
    custom_message: "Time to review today's spending and log any unrecorded expenses!",
  };
}

function getUserDailyExpenseStatus(userId: number, userDateStr?: string) {
  const targetDateStr = userDateStr || new Date().toISOString().split('T')[0];
  const userExpenses = dbInstance.expenses.filter(e => {
    if (e.user_id !== userId) return false;
    const expDate = e.expense_date ? e.expense_date.split('T')[0] : '';
    return expDate === targetDateStr;
  });

  const totalSpentToday = userExpenses.reduce((sum, e) => sum + e.amount, 0);
  const countToday = userExpenses.length;
  const hasLoggedToday = countToday > 0;

  const categoryMap: Record<string, number> = {};
  for (const exp of userExpenses) {
    const cat = dbInstance.categories.find(c => c.id === exp.category_id);
    const catName = cat ? cat.name : (exp.category_name || 'Other');
    categoryMap[catName] = (categoryMap[catName] || 0) + exp.amount;
  }

  const categoryBreakdown = Object.entries(categoryMap).map(([category, spent]) => ({
    category,
    spent,
  }));

  const user = dbInstance.users.find(u => u.id === userId);
  const reminderSettings = user?.reminder_settings || getDefaultReminderSettings(false);

  let promptMessage = "";
  if (!hasLoggedToday) {
    promptMessage = "You haven't recorded any expenses today yet. Did you buy coffee, groceries, or pay bills?";
  } else {
    promptMessage = `You've logged ${countToday} expense${countToday > 1 ? 's' : ''} totaling ₹${totalSpentToday.toLocaleString('en-IN')} today. Any evening purchases to add?`;
  }

  return {
    date: targetDateStr,
    count: countToday,
    total_spent: totalSpentToday,
    has_logged_today: hasLoggedToday,
    category_breakdown: categoryBreakdown,
    reminder_settings: reminderSettings,
    prompt_message: promptMessage,
  };
}

function checkAndTriggerDailyReminder(userId: number, forceTest = false) {
  const user = dbInstance.users.find(u => u.id === userId);
  if (!user) return null;

  const settings = user.reminder_settings || getDefaultReminderSettings(false);
  if (!settings.enabled && !forceTest) return null;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (!forceTest) {
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (settings.frequency === 'weekdays' && isWeekend) return null;
    if (settings.frequency === 'weekends' && !isWeekend) return null;

    if (settings.last_triggered_date === todayStr) {
      return null;
    }
  }

  const status = getUserDailyExpenseStatus(userId, todayStr);

  let message = settings.custom_message || "Time to review today's spending and log any unrecorded expenses!";
  if (settings.include_today_spent) {
    if (status.has_logged_today) {
      message = `Daily Expense Check-in: You have recorded ₹${status.total_spent.toLocaleString('en-IN')} across ${status.count} transaction(s) today. Tap to add any remaining receipts!`;
    } else {
      message = `Daily Expense Reminder: No expenses recorded today yet. Keep your budget updated by logging today's purchases!`;
    }
  }

  const notification: Notification = {
    id: dbInstance.nextIds.notifications++,
    user_id: userId,
    title: forceTest ? "⏰ Test Daily Expense Reminder" : "⏰ Daily Expense Reminder",
    message,
    type: "info",
    is_read: false,
    created_at: new Date().toISOString(),
  };

  dbInstance.notifications.push(notification);

  if (!forceTest) {
    settings.last_triggered_date = todayStr;
    settings.last_triggered_at = new Date().toISOString();
  }
  user.reminder_settings = settings;
  saveDatabase(dbInstance);

  return { notification, status, settings };
}

// Express App Initialization
async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health
  app.get('/api/health', (req, res) => {
    res.json({ status: "healthy", service: "PocketSmart AI", version: "1.0.0" });
  });

  // Auth Routes
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, confirm_password, confirmPassword } = req.body || {};
    const pass = password || '';
    const confirm = confirm_password || confirmPassword || '';

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: "A valid email address is required" });
    }
    if (pass.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }
    if (pass !== confirm) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = dbInstance.users.find(u => u.email === cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(pass, salt);
    const newUser: User = {
      id: dbInstance.nextIds.users++,
      name: name.trim(),
      email: cleanEmail,
      password_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    dbInstance.users.push(newUser);
    saveDatabase(dbInstance);

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash: _, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      data: { token, user: safeUser },
      message: "Registration successful"
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = dbInstance.users.find(u => u.email === cleanEmail);

    // If demo account and not found, auto-seed it
    if (!user && cleanEmail === 'demo@pocketsmart.ai') {
      seedDemoData(dbInstance);
      user = dbInstance.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isDemo = cleanEmail === 'demo@pocketsmart.ai';
    const isValidPass =
      bcrypt.compareSync(password, user.password_hash) ||
      (isDemo && ['Demo@123', 'Password123!', 'demo', 'demo123', 'password'].includes(password));

    if (!isValidPass) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash: _, ...safeUser } = user;

    return res.json({
      success: true,
      data: { token, user: safeUser },
      message: "Login successful"
    });
  });

  app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
    const user = dbInstance.users.find(u => u.id === req.user?.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const { password_hash: _, ...safeUser } = user;
    return res.json({ success: true, data: { user: safeUser } });
  });

  app.post('/api/auth/logout', authenticateToken, (req, res) => {
    return res.json({ success: true, message: "Logged out successfully" });
  });

  // Categories
  app.get('/api/categories', (req, res) => {
    return res.json({ success: true, data: dbInstance.categories });
  });

  app.post('/api/categories', (req, res) => {
    const { name, icon } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Category name is required" });
    const cleanName = name.trim();
    if (dbInstance.categories.find(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }
    const newCat: Category = {
      id: dbInstance.nextIds.categories++,
      name: cleanName,
      icon: (icon || "Tag").trim(),
      created_at: new Date().toISOString()
    };
    dbInstance.categories.push(newCat);
    saveDatabase(dbInstance);
    return res.status(201).json({ success: true, data: newCat, message: "Category created" });
  });

  // Dashboard API
  app.get('/api/dashboard', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    // Incomes
    const incomes = dbInstance.incomes.filter(i => {
      const d = new Date(i.date);
      return i.user_id === userId && (d.getMonth() + 1) === month && d.getFullYear() === year;
    });
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

    // Expenses
    const expenses = dbInstance.expenses.filter(e => {
      const d = new Date(e.expense_date);
      return e.user_id === userId && (d.getMonth() + 1) === month && d.getFullYear() === year;
    });
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // Budgets
    const budgets = dbInstance.budgets.filter(b => b.user_id === userId && b.month === month && b.year === year);
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);

    const remainingBalance = totalIncome - totalExpenses;
    const savings = remainingBalance;
    const savingsPercentage = totalIncome > 0 ? Math.round((savings / totalIncome) * 1000) / 10 : 0;
    const budgetUtilization = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 1000) / 10 : 0;

    // Category breakdown
    const catMap: Record<number, { spent: number; count: number }> = {};
    for (const exp of expenses) {
      if (!catMap[exp.category_id]) catMap[exp.category_id] = { spent: 0, count: 0 };
      catMap[exp.category_id].spent += exp.amount;
      catMap[exp.category_id].count += 1;
    }

    const budgetMap = new Map(budgets.map(b => [b.category_id, b.amount]));
    const categoryBreakdown = Object.entries(catMap).map(([catIdStr, val]) => {
      const catId = Number(catIdStr);
      const cat = dbInstance.categories.find(c => c.id === catId);
      const bAmt = budgetMap.get(catId) || 0;
      return {
        category: cat ? cat.name : "Other",
        category_id: catId,
        spent: val.spent,
        count: val.count,
        percentage: totalExpenses > 0 ? Math.round((val.spent / totalExpenses) * 1000) / 10 : 0,
        budget: bAmt,
        budget_utilization: bAmt > 0 ? Math.round((val.spent / bAmt) * 1000) / 10 : 0,
        is_over_budget: bAmt > 0 && val.spent > bAmt,
      };
    }).sort((a, b) => b.spent - a.spent);

    // Budget status list
    const budgetStatus = budgets.map(b => {
      const cat = dbInstance.categories.find(c => c.id === b.category_id);
      const spent = catMap[b.category_id]?.spent || 0;
      const util = b.amount > 0 ? Math.round((spent / b.amount) * 1000) / 10 : 0;
      let status = "normal";
      if (spent > b.amount) status = "exceeded";
      else if (util >= 80) status = "warning";

      return {
        ...b,
        category_name: cat?.name || "Other",
        category_icon: cat?.icon || "Tag",
        spent,
        remaining: b.amount - spent,
        utilization_percentage: util,
        status,
      };
    });

    // Recent transactions (last 8 expenses)
    const userAllExpenses = dbInstance.expenses
      .filter(e => e.user_id === userId)
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime() || b.id - a.id)
      .slice(0, 8)
      .map(e => {
        const cat = dbInstance.categories.find(c => c.id === e.category_id);
        return {
          ...e,
          category_name: cat?.name || "Other",
          category_icon: cat?.icon || "Tag",
        };
      });

    // Savings goals
    const goals = dbInstance.savings_goals.filter(g => g.user_id === userId);

    // Recommendations
    generateUserRecommendations(userId);
    const recs = dbInstance.recommendations
      .filter(r => r.user_id === userId)
      .sort((a, b) => (a.is_read === b.is_read ? b.id - a.id : a.is_read ? 1 : -1))
      .slice(0, 5);

    // Prediction
    const prediction = calculatePrediction(userId, totalExpenses, totalBudget);

    return res.json({
      success: true,
      data: {
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
        recent_expenses: userAllExpenses,
        budget_status: budgetStatus,
        savings_goals: goals,
        recommendations: recs,
        prediction,
        current_month: month,
        current_year: year,
      }
    });
  });

  // Income Routes
  app.get('/api/income', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const month = req.query.month ? parseInt(req.query.month as string, 10) : null;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : null;

    let items = dbInstance.incomes.filter(i => i.user_id === userId);
    if (year) {
      items = items.filter(i => new Date(i.date).getFullYear() === year);
    }
    if (month) {
      items = items.filter(i => new Date(i.date).getMonth() + 1 === month);
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id);
    return res.json({ success: true, data: items });
  });

  app.post('/api/income', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { amount, source, date, description } = req.body || {};

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }
    if (!source || !source.trim()) {
      return res.status(400).json({ success: false, message: "Income source is required" });
    }

    const incDate = date || new Date().toISOString().split('T')[0];
    const newInc: Income = {
      id: dbInstance.nextIds.incomes++,
      user_id: userId,
      amount: numAmount,
      source: source.trim(),
      date: incDate,
      description: (description || "").trim(),
      created_at: new Date().toISOString()
    };
    dbInstance.incomes.push(newInc);
    saveDatabase(dbInstance);

    return res.status(201).json({ success: true, data: newInc, message: "Income added successfully" });
  });

  app.put('/api/income/:id', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const inc = dbInstance.incomes.find(i => i.id === id && i.user_id === userId);
    if (!inc) return res.status(404).json({ success: false, message: "Income entry not found" });

    const { amount, source, date, description } = req.body || {};
    if (amount !== undefined) {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) return res.status(400).json({ success: false, message: "Amount must be positive" });
      inc.amount = num;
    }
    if (source !== undefined) {
      if (!source.trim()) return res.status(400).json({ success: false, message: "Source cannot be empty" });
      inc.source = source.trim();
    }
    if (date !== undefined) inc.date = date;
    if (description !== undefined) inc.description = description.trim();

    saveDatabase(dbInstance);
    return res.json({ success: true, data: inc, message: "Income updated successfully" });
  });

  app.delete('/api/income/:id', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const idx = dbInstance.incomes.findIndex(i => i.id === id && i.user_id === userId);
    if (idx === -1) return res.status(404).json({ success: false, message: "Income entry not found" });

    dbInstance.incomes.splice(idx, 1);
    saveDatabase(dbInstance);
    return res.json({ success: true, message: "Income deleted successfully" });
  });

  // Expense Routes
  app.get('/api/expenses', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const {
      category_id,
      category,
      start_date,
      end_date,
      month,
      year,
      payment_method,
      min_amount,
      max_amount,
      search,
      sort,
      page = '1',
      per_page = '50',
    } = req.query as Record<string, string>;

    let list = dbInstance.expenses.filter(e => e.user_id === userId);

    if (category_id) {
      const cid = parseInt(category_id, 10);
      list = list.filter(e => e.category_id === cid);
    } else if (category) {
      const matchedCat = dbInstance.categories.find(c => c.name.toLowerCase().includes(category.toLowerCase()));
      if (matchedCat) list = list.filter(e => e.category_id === matchedCat.id);
    }

    if (start_date) {
      list = list.filter(e => e.expense_date >= start_date);
    }
    if (end_date) {
      list = list.filter(e => e.expense_date <= end_date);
    }
    if (year) {
      const y = parseInt(year, 10);
      list = list.filter(e => new Date(e.expense_date).getFullYear() === y);
    }
    if (month) {
      const m = parseInt(month, 10);
      list = list.filter(e => new Date(e.expense_date).getMonth() + 1 === m);
    }
    if (payment_method) {
      list = list.filter(e => e.payment_method.toLowerCase() === payment_method.toLowerCase());
    }
    if (min_amount) {
      const min = parseFloat(min_amount);
      list = list.filter(e => e.amount >= min);
    }
    if (max_amount) {
      const max = parseFloat(max_amount);
      list = list.filter(e => e.amount <= max);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => e.description.toLowerCase().includes(q));
    }

    // Sort
    if (sort === 'date_asc') {
      list.sort((a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime() || a.id - b.id);
    } else if (sort === 'amount_desc') {
      list.sort((a, b) => b.amount - a.amount || b.id - a.id);
    } else if (sort === 'amount_asc') {
      list.sort((a, b) => a.amount - b.amount || a.id - b.id);
    } else {
      // date_desc
      list.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime() || b.id - a.id);
    }

    const totalCount = list.length;
    const p = Math.max(1, parseInt(page, 10));
    const limit = Math.max(1, parseInt(per_page, 10));
    const offset = (p - 1) * limit;
    const paginated = list.slice(offset, offset + limit).map(e => {
      const cat = dbInstance.categories.find(c => c.id === e.category_id);
      return {
        ...e,
        category_name: cat?.name || "Other",
        category_icon: cat?.icon || "Tag"
      };
    });

    return res.json({
      success: true,
      data: {
        expenses: paginated,
        total: totalCount,
        page: p,
        per_page: limit,
        total_pages: Math.ceil(totalCount / limit) || 1,
      }
    });
  });

  app.get('/api/expenses/:id', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const exp = dbInstance.expenses.find(e => e.id === id && e.user_id === userId);
    if (!exp) return res.status(404).json({ success: false, message: "Expense not found" });

    const cat = dbInstance.categories.find(c => c.id === exp.category_id);
    return res.json({
      success: true,
      data: {
        ...exp,
        category_name: cat?.name || "Other",
        category_icon: cat?.icon || "Tag"
      }
    });
  });

  app.post('/api/expenses', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { amount, description, category_id, payment_method, expense_date, date } = req.body || {};

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    if (!description || !description.trim()) return res.status(400).json({ success: false, message: "Description is required" });

    let finalCatId = category_id;
    if (!finalCatId) {
      const predicted = predictCategory(description);
      const cat = dbInstance.categories.find(c => c.name.toLowerCase() === predicted.toLowerCase());
      finalCatId = cat ? cat.id : 10; // 10 is Other
    } else {
      const catExists = dbInstance.categories.some(c => c.id === finalCatId);
      if (!catExists) finalCatId = 10;
    }

    const expDate = expense_date || date || new Date().toISOString().split('T')[0];
    const newExp: Expense = {
      id: dbInstance.nextIds.expenses++,
      user_id: userId,
      category_id: finalCatId,
      amount: num,
      description: description.trim(),
      payment_method: payment_method || "UPI",
      expense_date: expDate,
      created_at: new Date().toISOString()
    };
    dbInstance.expenses.push(newExp);
    saveDatabase(dbInstance);

    const cat = dbInstance.categories.find(c => c.id === finalCatId);
    return res.status(201).json({
      success: true,
      data: { ...newExp, category_name: cat?.name || "Other", category_icon: cat?.icon || "Tag" },
      message: "Expense created successfully"
    });
  });

  app.put('/api/expenses/:id', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const exp = dbInstance.expenses.find(e => e.id === id && e.user_id === userId);
    if (!exp) return res.status(404).json({ success: false, message: "Expense not found" });

    const { amount, description, category_id, payment_method, expense_date } = req.body || {};
    if (amount !== undefined) {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) return res.status(400).json({ success: false, message: "Amount must be positive" });
      exp.amount = num;
    }
    if (description !== undefined) {
      if (!description.trim()) return res.status(400).json({ success: false, message: "Description cannot be empty" });
      exp.description = description.trim();
    }
    if (category_id !== undefined) exp.category_id = parseInt(category_id, 10);
    if (payment_method !== undefined) exp.payment_method = payment_method;
    if (expense_date !== undefined) exp.expense_date = expense_date;

    saveDatabase(dbInstance);
    const cat = dbInstance.categories.find(c => c.id === exp.category_id);
    return res.json({
      success: true,
      data: { ...exp, category_name: cat?.name || "Other", category_icon: cat?.icon || "Tag" },
      message: "Expense updated successfully"
    });
  });

  app.delete('/api/expenses/:id', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const idx = dbInstance.expenses.findIndex(e => e.id === id && e.user_id === userId);
    if (idx === -1) return res.status(404).json({ success: false, message: "Expense not found" });

    dbInstance.expenses.splice(idx, 1);
    saveDatabase(dbInstance);
    return res.json({ success: true, message: "Expense deleted successfully" });
  });

  app.post('/api/expenses/categorize', authenticateToken, (req, res) => {
    const { description } = req.body || {};
    const predicted = predictCategory(description);
    const cat = dbInstance.categories.find(c => c.name.toLowerCase() === predicted.toLowerCase());
    return res.json({
      success: true,
      data: {
        category_name: predicted,
        category_id: cat ? cat.id : null
      }
    });
  });

  // Budgets
  app.get('/api/budgets', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    const budgets = dbInstance.budgets.filter(b => b.user_id === userId && b.month === month && b.year === year);

    // Calculate spent
    const list = budgets.map(b => {
      const cat = dbInstance.categories.find(c => c.id === b.category_id);
      const spent = dbInstance.expenses
        .filter(e => {
          const d = new Date(e.expense_date);
          return e.user_id === userId && e.category_id === b.category_id && (d.getMonth() + 1) === month && d.getFullYear() === year;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      const util = b.amount > 0 ? Math.round((spent / b.amount) * 1000) / 10 : 0;
      let status = "normal";
      if (spent > b.amount) status = "exceeded";
      else if (util >= 80) status = "warning";

      return {
        ...b,
        category_name: cat?.name || "Other",
        category_icon: cat?.icon || "Tag",
        spent,
        remaining: b.amount - spent,
        utilization_percentage: util,
        status
      };
    });

    return res.json({ success: true, data: list });
  });

  app.post('/api/budgets', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { category_id, amount, month, year } = req.body || {};

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return res.status(400).json({ success: false, message: "Budget amount must be positive" });
    if (!category_id) return res.status(400).json({ success: false, message: "Category ID is required" });

    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    const cid = parseInt(category_id, 10);

    const existing = dbInstance.budgets.find(b => b.user_id === userId && b.category_id === cid && b.month === m && b.year === y);
    if (existing) {
      existing.amount = num;
      saveDatabase(dbInstance);
      const cat = dbInstance.categories.find(c => c.id === cid);
      return res.json({
        success: true,
        data: { ...existing, category_name: cat?.name || "Other", category_icon: cat?.icon || "Tag" },
        message: "Budget updated successfully"
      });
    }

    const newBudget: Budget = {
      id: dbInstance.nextIds.budgets++,
      user_id: userId,
      category_id: cid,
      amount: num,
      month: m,
      year: y,
      created_at: new Date().toISOString()
    };
    dbInstance.budgets.push(newBudget);
    saveDatabase(dbInstance);

    const cat = dbInstance.categories.find(c => c.id === cid);
    return res.status(201).json({
      success: true,
      data: { ...newBudget, category_name: cat?.name || "Other", category_icon: cat?.icon || "Tag" },
      message: "Budget created successfully"
    });
  });

  app.put('/api/budgets/:id', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const budget = dbInstance.budgets.find(b => b.id === id && b.user_id === userId);
    if (!budget) return res.status(404).json({ success: false, message: "Budget not found" });

    const { amount } = req.body || {};
    if (amount !== undefined) {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) return res.status(400).json({ success: false, message: "Amount must be positive" });
      budget.amount = num;
    }

    saveDatabase(dbInstance);
    return res.json({ success: true, data: budget, message: "Budget updated successfully" });
  });

  app.delete('/api/budgets/:id', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const idx = dbInstance.budgets.findIndex(b => b.id === id && b.user_id === userId);
    if (idx === -1) return res.status(404).json({ success: false, message: "Budget not found" });

    dbInstance.budgets.splice(idx, 1);
    saveDatabase(dbInstance);
    return res.json({ success: true, message: "Budget deleted successfully" });
  });

  // Savings Goals
  app.get('/api/savings-goals', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const goals = dbInstance.savings_goals
      .filter(g => g.user_id === userId)
      .map(g => ({
        ...g,
        progress_percentage: g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 1000) / 10) : 0
      }));
    return res.json({ success: true, data: goals });
  });

  app.post('/api/savings-goals', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { name, target_amount, current_amount = 0, target_date, description } = req.body || {};

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Goal name is required" });
    const target = parseFloat(target_amount);
    if (isNaN(target) || target <= 0) return res.status(400).json({ success: false, message: "Target amount must be positive" });
    if (!target_date) return res.status(400).json({ success: false, message: "Target date is required" });

    const newGoal: SavingsGoal = {
      id: dbInstance.nextIds.savings_goals++,
      user_id: userId,
      name: name.trim(),
      target_amount: target,
      current_amount: parseFloat(current_amount) || 0,
      target_date,
      description: (description || "").trim(),
      created_at: new Date().toISOString()
    };
    dbInstance.savings_goals.push(newGoal);
    saveDatabase(dbInstance);

    return res.status(201).json({
      success: true,
      data: {
        ...newGoal,
        progress_percentage: target > 0 ? Math.min(100, Math.round((newGoal.current_amount / target) * 1000) / 10) : 0
      },
      message: "Savings goal created"
    });
  });

  app.put('/api/savings-goals/:id', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const goal = dbInstance.savings_goals.find(g => g.id === id && g.user_id === userId);
    if (!goal) return res.status(404).json({ success: false, message: "Savings goal not found" });

    const { name, target_amount, current_amount, add_amount, target_date, description } = req.body || {};

    if (name !== undefined) goal.name = name.trim();
    if (target_amount !== undefined) goal.target_amount = parseFloat(target_amount);
    if (add_amount !== undefined) {
      const add = parseFloat(add_amount);
      if (!isNaN(add) && add > 0) goal.current_amount += add;
    } else if (current_amount !== undefined) {
      goal.current_amount = parseFloat(current_amount);
    }
    if (target_date !== undefined) goal.target_date = target_date;
    if (description !== undefined) goal.description = description.trim();

    saveDatabase(dbInstance);
    return res.json({
      success: true,
      data: {
        ...goal,
        progress_percentage: goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 1000) / 10) : 0
      },
      message: "Savings goal updated"
    });
  });

  app.delete('/api/savings-goals/:id', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const idx = dbInstance.savings_goals.findIndex(g => g.id === id && g.user_id === userId);
    if (idx === -1) return res.status(404).json({ success: false, message: "Savings goal not found" });

    dbInstance.savings_goals.splice(idx, 1);
    saveDatabase(dbInstance);
    return res.json({ success: true, message: "Savings goal deleted" });
  });

  // Recommendations
  app.get('/api/recommendations', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    generateUserRecommendations(userId);
    const recs = dbInstance.recommendations
      .filter(r => r.user_id === userId)
      .sort((a, b) => (a.is_read === b.is_read ? b.id - a.id : a.is_read ? 1 : -1));
    return res.json({ success: true, data: recs });
  });

  app.post('/api/recommendations/generate', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    generateUserRecommendations(userId);
    const recs = dbInstance.recommendations
      .filter(r => r.user_id === userId)
      .sort((a, b) => (a.is_read === b.is_read ? b.id - a.id : a.is_read ? 1 : -1));
    return res.json({ success: true, data: recs, message: "Recommendations updated" });
  });

  app.put('/api/recommendations/:id/read', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const rec = dbInstance.recommendations.find(r => r.id === id && r.user_id === userId);
    if (!rec) return res.status(404).json({ success: false, message: "Recommendation not found" });

    rec.is_read = true;
    saveDatabase(dbInstance);
    return res.json({ success: true, data: rec, message: "Marked as read" });
  });

  // Notifications
  app.get('/api/notifications', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;

    // Check if daily reminder should be triggered now
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const userObj = dbInstance.users.find(u => u.id === userId);
    if (userObj?.reminder_settings?.enabled && currentTimeStr >= userObj.reminder_settings.time) {
      checkAndTriggerDailyReminder(userId, false);
    }

    const list = dbInstance.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => (a.is_read === b.is_read ? b.id - a.id : a.is_read ? 1 : -1));
    return res.json({ success: true, data: list });
  });

  app.put('/api/notifications/:id/read', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const id = parseInt(req.params.id, 10);
    const notif = dbInstance.notifications.find(n => n.id === id && n.user_id === userId);
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });

    notif.is_read = true;
    saveDatabase(dbInstance);
    return res.json({ success: true, data: notif, message: "Notification marked as read" });
  });

  // Daily Expense Reminder Configuration Routes
  app.get('/api/user/reminder-settings', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const user = dbInstance.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.reminder_settings) {
      user.reminder_settings = getDefaultReminderSettings(true);
      saveDatabase(dbInstance);
    }

    const status = getUserDailyExpenseStatus(userId);
    return res.json({
      success: true,
      data: user.reminder_settings,
      status,
      server_time: new Date().toISOString(),
    });
  });

  app.put('/api/user/reminder-settings', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const user = dbInstance.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const current = user.reminder_settings || getDefaultReminderSettings(true);
    const {
      enabled,
      time,
      frequency,
      channel,
      include_today_spent,
      min_spending_alert_enabled,
      custom_message,
    } = req.body || {};

    user.reminder_settings = {
      ...current,
      ...(enabled !== undefined ? { enabled: Boolean(enabled) } : {}),
      ...(time ? { time: String(time) } : {}),
      ...(frequency ? { frequency } : {}),
      ...(channel ? { channel } : {}),
      ...(include_today_spent !== undefined ? { include_today_spent: Boolean(include_today_spent) } : {}),
      ...(min_spending_alert_enabled !== undefined ? { min_spending_alert_enabled: Boolean(min_spending_alert_enabled) } : {}),
      ...(custom_message !== undefined ? { custom_message: String(custom_message) } : {}),
    };

    saveDatabase(dbInstance);
    return res.json({
      success: true,
      data: user.reminder_settings,
      message: "Daily expense reminder settings saved successfully",
    });
  });

  app.get('/api/user/daily-expense-status', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const dateQuery = typeof req.query.date === 'string' ? req.query.date : undefined;
    const status = getUserDailyExpenseStatus(userId, dateQuery);
    return res.json({ success: true, data: status });
  });

  app.post('/api/user/reminder-test', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const result = checkAndTriggerDailyReminder(userId, true);
    if (!result) {
      return res.status(500).json({ success: false, message: "Could not generate test reminder" });
    }
    return res.json({
      success: true,
      message: "Daily expense reminder sent!",
      data: result,
    });
  });

  // Analytics Endpoints
  app.get('/api/analytics/monthly', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    const incs = dbInstance.incomes.filter(i => {
      const d = new Date(i.date);
      return i.user_id === userId && (d.getMonth() + 1) === month && d.getFullYear() === year;
    });
    const exps = dbInstance.expenses.filter(e => {
      const d = new Date(e.expense_date);
      return e.user_id === userId && (d.getMonth() + 1) === month && d.getFullYear() === year;
    });
    const buds = dbInstance.budgets.filter(b => b.user_id === userId && b.month === month && b.year === year);

    const totalIncome = incs.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = exps.reduce((s, e) => s + e.amount, 0);
    const totalBudget = buds.reduce((s, b) => s + b.amount, 0);
    const remaining = totalIncome - totalExpenses;

    return res.json({
      success: true,
      data: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        remaining_balance: remaining,
        savings: remaining,
        savings_percentage: totalIncome > 0 ? Math.round((remaining / totalIncome) * 1000) / 10 : 0,
        total_budget: totalBudget,
        budget_utilization: totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 1000) / 10 : 0,
        month,
        year,
      }
    });
  });

  app.get('/api/analytics/categories', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    const exps = dbInstance.expenses.filter(e => {
      const d = new Date(e.expense_date);
      return e.user_id === userId && (d.getMonth() + 1) === month && d.getFullYear() === year;
    });
    const buds = dbInstance.budgets.filter(b => b.user_id === userId && b.month === month && b.year === year);
    const totalExpenses = exps.reduce((s, e) => s + e.amount, 0);

    const catMap: Record<number, { spent: number; count: number }> = {};
    for (const e of exps) {
      if (!catMap[e.category_id]) catMap[e.category_id] = { spent: 0, count: 0 };
      catMap[e.category_id].spent += e.amount;
      catMap[e.category_id].count += 1;
    }

    const budgetMap = new Map(buds.map(b => [b.category_id, b.amount]));
    const breakdown = Object.entries(catMap).map(([cidStr, val]) => {
      const cid = Number(cidStr);
      const cat = dbInstance.categories.find(c => c.id === cid);
      const bAmt = budgetMap.get(cid) || 0;
      return {
        category: cat?.name || "Other",
        category_id: cid,
        spent: val.spent,
        count: val.count,
        percentage: totalExpenses > 0 ? Math.round((val.spent / totalExpenses) * 1000) / 10 : 0,
        budget: bAmt,
        budget_utilization: bAmt > 0 ? Math.round((val.spent / bAmt) * 1000) / 10 : 0,
        is_over_budget: bAmt > 0 && val.spent > bAmt,
      };
    }).sort((a, b) => b.spent - a.spent);

    return res.json({ success: true, data: breakdown });
  });

  app.get('/api/analytics/trends', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const monthlyMap: Record<string, { income: number; expense: number }> = {};

    for (const inc of dbInstance.incomes.filter(i => i.user_id === userId)) {
      const key = inc.date.slice(0, 7);
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
      monthlyMap[key].income += inc.amount;
    }

    for (const exp of dbInstance.expenses.filter(e => e.user_id === userId)) {
      const key = exp.expense_date.slice(0, 7);
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
      monthlyMap[key].expense += exp.amount;
    }

    const trends = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, val]) => ({
        month,
        income: val.income,
        expense: val.expense,
        net_savings: val.income - val.expense,
      }));

    return res.json({ success: true, data: trends });
  });

  app.get('/api/analytics/cashflow', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    const incSum = dbInstance.incomes
      .filter(i => {
        const d = new Date(i.date);
        return i.user_id === userId && (d.getMonth() + 1) === month && d.getFullYear() === year;
      })
      .reduce((s, i) => s + i.amount, 0);

    const expSum = dbInstance.expenses
      .filter(e => {
        const d = new Date(e.expense_date);
        return e.user_id === userId && (d.getMonth() + 1) === month && d.getFullYear() === year;
      })
      .reduce((s, e) => s + e.amount, 0);

    const net = incSum - expSum;
    return res.json({
      success: true,
      data: {
        month,
        year,
        total_income: incSum,
        total_expense: expSum,
        net_cashflow: net,
        is_positive: net >= 0,
      }
    });
  });

  app.get('/api/analytics/prediction', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const currentExpenses = dbInstance.expenses
      .filter(e => {
        const d = new Date(e.expense_date);
        return e.user_id === userId && (d.getMonth() + 1) === month && d.getFullYear() === year;
      })
      .reduce((s, e) => s + e.amount, 0);

    const currentBudget = dbInstance.budgets
      .filter(b => b.user_id === userId && b.month === month && b.year === year)
      .reduce((s, b) => s + b.amount, 0);

    const pred = calculatePrediction(userId, currentExpenses, currentBudget);
    return res.json({ success: true, data: pred });
  });

  // Assistant Query Route
  app.post('/api/assistant', authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { message, prompt } = req.body || {};
    const query = (message || prompt || "").toLowerCase().trim();

    if (!query) {
      return res.status(400).json({ success: false, message: "Question cannot be empty" });
    }

    const now = new Date();
    const currMonth = now.getMonth() + 1;
    const currYear = now.getFullYear();
    const monthName = now.toLocaleString('default', { month: 'long' });

    const userIncomes = dbInstance.incomes.filter(i => {
      const d = new Date(i.date);
      return i.user_id === userId && (d.getMonth() + 1) === currMonth && d.getFullYear() === currYear;
    });
    const totalIncome = userIncomes.reduce((s, i) => s + i.amount, 0);

    const userExpenses = dbInstance.expenses.filter(e => {
      const d = new Date(e.expense_date);
      return e.user_id === userId && (d.getMonth() + 1) === currMonth && d.getFullYear() === currYear;
    });
    const totalExpenses = userExpenses.reduce((s, e) => s + e.amount, 0);

    const userBudgets = dbInstance.budgets.filter(b => b.user_id === userId && b.month === currMonth && b.year === currYear);
    const totalBudget = userBudgets.reduce((s, b) => s + b.amount, 0);
    const remaining = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((remaining / totalIncome) * 1000) / 10 : 0;
    const budgetUtil = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 1000) / 10 : 0;

    // Category spending map
    const catSpent: Record<number, number> = {};
    for (const exp of userExpenses) {
      catSpent[exp.category_id] = (catSpent[exp.category_id] || 0) + exp.amount;
    }

    const sortedCats = Object.entries(catSpent)
      .map(([cidStr, amt]) => {
        const cat = dbInstance.categories.find(c => c.id === Number(cidStr));
        const bAmt = userBudgets.find(b => b.category_id === Number(cidStr))?.amount || 0;
        return {
          id: Number(cidStr),
          name: cat?.name || "Other",
          spent: amt,
          budget: bAmt,
          percentage: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.spent - a.spent);

    let answer = "";
    let dataPoints: any = {};

    // 1. Highest spending
    if (query.includes("most on") || query.includes("highest") || query.includes("biggest") || query.includes("top spending")) {
      if (sortedCats.length === 0) {
        answer = "You haven't recorded any expenses for this month yet.";
      } else {
        const top = sortedCats[0];
        answer = `You are spending the most on **${top.name}**, totaling **₹${top.spent.toLocaleString('en-IN')}**, which accounts for **${top.percentage}%** of your total monthly expenditures.`;
        dataPoints = top;
      }
    }
    // 2. Spent this month
    else if (query.includes("how much did i spend") || query.includes("total spend") || query.includes("total expense") || query.includes("spent this month")) {
      answer = `In ${monthName} ${currYear}, you have spent **₹${totalExpenses.toLocaleString('en-IN')}** across ${userExpenses.length} transactions.`;
      dataPoints = { total_expenses: totalExpenses, transaction_count: userExpenses.length };
    }
    // 3. Exceeding budget
    else if (query.includes("exceed") || query.includes("over budget") || query.includes("budget limit")) {
      const over = sortedCats.filter(c => c.budget > 0 && c.spent > c.budget);
      const close = sortedCats.filter(c => c.budget > 0 && c.spent <= c.budget && c.spent >= 0.8 * c.budget);

      if (over.length > 0) {
        const listStr = over.map(c => `**${c.name}** (₹${c.spent.toLocaleString('en-IN')} spent vs ₹${c.budget.toLocaleString('en-IN')} budget)`).join(", ");
        answer = `⚠️ Yes, you have exceeded your budget in ${over.length} category: ${listStr}.`;
        dataPoints = { over };
      } else if (close.length > 0) {
        const listStr = close.map(c => `**${c.name}** (${Math.round((c.spent / c.budget) * 100)}%)`).join(", ");
        answer = `You haven't exceeded any budget yet, but you are close in: ${listStr}.`;
        dataPoints = { close };
      } else if (totalBudget > 0) {
        answer = `✅ You are well within your budgets! Overall monthly budget utilization is **${budgetUtil}%** (₹${totalExpenses.toLocaleString('en-IN')} of ₹${totalBudget.toLocaleString('en-IN')}).`;
        dataPoints = { utilization: budgetUtil };
      } else {
        answer = "You haven't set up category budgets for this month yet. You can create them in the Budgets section.";
      }
    }
    // 4. Money left / remaining
    else if (query.includes("have left") || query.includes("remaining") || query.includes("balance") || query.includes("left to spend")) {
      answer = `You have **₹${remaining.toLocaleString('en-IN')}** remaining this month (Total Income: ₹${totalIncome.toLocaleString('en-IN')}, Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}).`;
      dataPoints = { remaining, income: totalIncome, expenses: totalExpenses };
    }
    // 5. How much can I save
    else if (query.includes("can i save") || query.includes("how much can i save") || query.includes("savings rate") || query.includes("my savings")) {
      answer = `Based on your logged transactions, your current net monthly savings are **₹${remaining.toLocaleString('en-IN')}**, which is a **${savingsRate}%** savings rate.`;
      dataPoints = { savings: remaining, rate: savingsRate };
    }
    // 6. Specific category check (e.g. food, rent, shopping)
    else {
      let matchedCategory = null;
      for (const cat of dbInstance.categories) {
        if (query.includes(cat.name.toLowerCase())) {
          matchedCategory = cat;
          break;
        }
      }

      if (matchedCategory) {
        const catStat = sortedCats.find(c => c.id === matchedCategory!.id);
        const spent = catStat?.spent || 0;
        const bText = catStat?.budget ? ` against an allocated budget of ₹${catStat.budget.toLocaleString('en-IN')}` : "";
        answer = `You have spent **₹${spent.toLocaleString('en-IN')}** on **${matchedCategory.name}** this month${bText}.`;
        dataPoints = catStat || { name: matchedCategory.name, spent: 0 };
      } else {
        // General financial assistant summary
        answer = `Here is your current financial snapshot for ${monthName} ${currYear}:\n` +
          `• **Income**: ₹${totalIncome.toLocaleString('en-IN')}\n` +
          `• **Expenses**: ₹${totalExpenses.toLocaleString('en-IN')}\n` +
          `• **Net Balance**: ₹${remaining.toLocaleString('en-IN')}\n` +
          `• **Budget Utilization**: ${budgetUtil}%\n\n` +
          `You can ask me specific questions like:\n` +
          `• "What am I spending most on?"\n` +
          `• "Am I exceeding my budget?"\n` +
          `• "How much did I spend on Food?"\n` +
          `• "How much money do I have left?"`;
        dataPoints = { totalIncome, totalExpenses, remaining, budgetUtil };
      }
    }

    return res.json({
      success: true,
      data: {
        answer,
        data_points: dataPoints
      }
    });
  });

  // Background ticker for automated daily expense reminders
  setInterval(() => {
    try {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      for (const u of dbInstance.users) {
        if (u.reminder_settings && u.reminder_settings.enabled) {
          if (u.reminder_settings.last_triggered_date !== todayStr) {
            if (currentTimeStr >= u.reminder_settings.time) {
              checkAndTriggerDailyReminder(u.id, false);
            }
          }
        }
      }
    } catch {
      // safe silent ignore
    }
  }, 60000);

  const httpServer = http.createServer(app);

  // Frontend Integration with Vite
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PocketSmart AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start PocketSmart AI server:", err);
});
