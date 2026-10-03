# PocketSmart AI — Smart Budget & Recommendation Assistant

PocketSmart AI is an enterprise-grade, full-stack personal finance application where authenticated users can manage income, expenses, category budgets, savings goals, predictive run-rate analytics, and receive automated, data-driven financial recommendations.

---

## 🚀 Key Features

1. **Deterministic Financial Analytics**
   - Exact mathematical computation of total income, total expenditures, net remaining balance, and savings percentage.
   - Comprehensive multi-month cashflow comparisons and category distribution charts.

2. **Automated Expense Categorization**
   - Keyword-based intelligent classifier that maps natural language descriptions (e.g., *"Starbucks coffee"*, *"Uber to office"*, *"Amazon groceries"*) to target categories with override capabilities.
   - Modular architecture ready for future ML embeddings and logistic regression classifiers.

3. **Active Budget Tracking & Warning Engine**
   - Category-level budgets with visual progress indicators.
   - Real-time status states: **Normal (<80%)**, **Warning (≥80%)**, and **Exceeded (>100%)**.

4. **Run-Rate Spending Prediction**
   - Deterministic extrapolation based on daily spending averages and calendar month days elapsed.
   - Safeguards against early-month volatility and zero-expense anomalies.

5. **Data-Grounded AI Assistant**
   - Interactive financial query assistant that strictly interrogates the authenticated user's real database records.
   - Answers inquiries such as *"What am I spending most on?"*, *"Am I exceeding my budget?"*, and *"How much money do I have left?"* without hallucinating figures.

6. **Savings Goals with Deposit Tracking**
   - Goal targets, target dates, progress tracking, and direct one-click deposit contributions.

7. **Cryptographic Security & Tenant Isolation**
   - JWT token authentication, Bcrypt password hashing, and user ownership validation across every REST endpoint.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19 + TypeScript + Vite
  - Tailwind CSS v4
  - React Router DOM v7
  - Lucide React Icons
  - Recharts for financial visualization
  - Axios with JWT Interceptor

- **Backend (Python / Flask Foundation)**:
  - Python 3.10
  - Flask 3.0 + Flask-CORS
  - Flask-JWT-Extended
  - SQLAlchemy ORM
  - Werkzeug Security password hashing
  - Pytest test suite

- **Runtime & Deployment**:
  - Full-stack Express/TSX server (`server.ts`) with mounted Vite development middleware running on Port 3000.
  - Persistent JSON/SQLite transactional ledger with seeded demo data.

---

## 📁 Folder Structure

```
├── backend/
│   ├── app.py                      # Flask Application Factory
│   ├── config.py                   # Configuration & Environment loading
│   ├── extensions.py               # db, jwt, cors instances
│   ├── requirements.txt            # Python dependencies
│   ├── seed.py                     # Demo data generator
│   ├── .env.example                # Backend environment template
│   ├── models/
│   │   ├── user.py                 # User authentication model
│   │   ├── income.py               # Income records
│   │   ├── expense.py              # Expense records with category FK
│   │   ├── category.py             # Category definitions
│   │   ├── budget.py               # Monthly budgets with unique constraint
│   │   ├── savings_goal.py         # Savings goals and target dates
│   │   ├── recommendation.py       # Rule-based suggestions
│   │   └── notification.py         # System alerts and notifications
│   ├── routes/
│   │   ├── auth.py                 # Registration, login, me, logout
│   │   ├── dashboard.py            # Overview metrics and recent activity
│   │   ├── income.py               # Income CRUD
│   │   ├── expenses.py             # Expenses CRUD with filtering and search
│   │   ├── budgets.py              # Budgets CRUD and utilization checks
│   │   ├── categories.py           # Categories list and creation
│   │   ├── analytics.py            # Trends, cashflow, category summaries
│   │   ├── recommendations.py      # Recommendation generation & read status
│   │   ├── savings_goals.py        # Goals CRUD and deposit handling
│   │   ├── notifications.py        # Notification feed
│   │   └── assistant.py            # Real-data AI query answering
│   ├── services/
│   │   ├── analytics_service.py    # Deterministic financial calculations
│   │   ├── categorization_service.py # Keyword description classifier
│   │   ├── prediction_service.py   # Spending run-rate predictor
│   │   └── recommendation_service.py # Rule-based recommendation engine
│   ├── utils/
│   │   └── validators.py           # Email, password, and numeric validators
│   └── tests/
│       ├── test_auth.py            # Auth & registration tests
│       ├── test_expenses.py        # Expense CRUD tests
│       ├── test_budget_calculations.py # Budget utilization & dashboard tests
│       ├── test_recommendations.py # Rule trigger tests
│       └── test_security.py        # Token protection & tenant isolation tests
│
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   ├── BudgetCard.tsx
│   │   ├── RecommendationCard.tsx
│   │   ├── TransactionTable.tsx
│   │   ├── ChartCard.tsx
│   │   ├── ExpenseForm.tsx
│   │   ├── IncomeForm.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   ├── context/
│   │   └── AuthContext.tsx         # Global user session context
│   ├── hooks/
│   │   └── useAuth.ts              # Authentication hook
│   ├── layouts/
│   │   └── DashboardLayout.tsx     # Primary shell with sidebar & header
│   ├── pages/
│   │   ├── Landing.tsx             # Marketing and 1-click demo entry
│   │   ├── Login.tsx               # Sign in page
│   │   ├── Register.tsx            # Account creation
│   │   ├── Dashboard.tsx           # Primary financial dashboard
│   │   ├── Expenses.tsx            # Expense ledger with filters
│   │   ├── Income.tsx              # Income stream management
│   │   ├── Budgets.tsx             # Budgets with progress bars
│   │   ├── Analytics.tsx           # Charts, trends, and forecasts
│   │   ├── SavingsGoals.tsx        # Savings milestones and deposits
│   │   ├── AIAssistant.tsx         # Conversational assistant
│   │   └── Profile.tsx             # User profile & telemetry
│   ├── services/                   # Frontend API integration services
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── expenseService.ts
│   │   ├── incomeService.ts
│   │   ├── budgetService.ts
│   │   ├── analyticsService.ts
│   │   └── recommendationService.ts
│   ├── App.tsx                     # Route configuration
│   └── main.tsx                    # React DOM entrypoint
├── server.ts                       # Full-stack server with Vite middleware
├── package.json
└── tsconfig.json
```

---

## 🔑 Demo Account Credentials

A pre-seeded demonstration account is available out-of-the-box:

- **Email**: `demo@pocketsmart.ai`
- **Password**: `Demo@123`

You can log in directly using the **"1-Click Demo Login"** button on the landing page or enter the credentials manually on the login page.

---

## 💻 Local Setup & Execution Instructions

### Option 1: Full-Stack Mode (Integrated Node / Express / Vite on Port 3000)

```bash
# 1. Install dependencies
npm install

# 2. Run the application
npm run dev

# Application will be accessible at http://localhost:3000
```

### Option 2: Python Flask Backend Standalone

```bash
# 1. Setup virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install requirements
pip install -r backend/requirements.txt

# 3. Seed demo data
python backend/seed.py

# 4. Start the Flask server
python backend/app.py
```

---

## 🧪 Testing Instructions

Run the backend Pytest test suite:
```bash
pytest backend/tests
```

All test cases verify:
- User registration and password hashing validation
- JWT token rejection on unauthorized endpoints
- Expense CRUD operations
- Budget calculation and 80% warning / 100% exceeded triggers
- Multi-tenant security (User A cannot access User B's records)

---

## 📱 Android Application & Packaging

PocketSmart AI is engineered as an Android-first application:

1. **Android WebAPK / PWA**:
   - Installable directly onto Android devices via Chrome, Edge, or Samsung Internet.
   - Launches in full `standalone` fullscreen mode with Android status bar styling (`#0f172a`), icon badging, and Android home screen shortcuts.
   - Offline service worker precaching via `vite-plugin-pwa` with Workbox runtime caching.

2. **Android UI & Interaction Patterns**:
   - **Material 3 Bottom Navigation**: Home, Expenses, Quick Add FAB, Budgets, and AI Assistant.
   - **Android Quick Action Sheet**: Instant expense logging, income entry, and camera receipt scanning (`capture="environment"`).
   - **Tactile Haptic Feedback**: Native vibration patterns (`navigator.vibrate`) for touches, budget warnings, and confirmations.
   - **Android Native Share**: Share budget summaries and financial milestones to Android apps via `navigator.share`.
   - **Android Phone Frame Simulator**: Google Pixel 8 simulator on desktop view with battery, 5G, and 3-button system navigation.

3. **Building a Native Android APK with Capacitor**:
   ```bash
   # 1. Build the production web bundle
   npm run build

   # 2. Add Android platform via Capacitor
   npx @capacitor/cli add android

   # 3. Open in Android Studio
   npx @capacitor/cli open android

   # 4. In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
   ```
   The pre-configured `capacitor.config.json` is located in the repository root.

