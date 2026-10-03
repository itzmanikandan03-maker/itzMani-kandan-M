import http from 'http';

async function request(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const url = `http://127.0.0.1:3000${path}`;
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let bodyStr: string | undefined;

  if (options.body) {
    bodyStr = JSON.stringify(options.body);
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: bodyStr,
  });

  const json = await res.json();
  return { status: res.status, data: json };
}

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE POCKETSMART VERIFICATION ===");

  // 1. Health check
  const health = await request('/api/health');
  console.log("Health Check:", health.status, health.data);
  if (health.status !== 200) throw new Error("Health check failed");

  // 2. Demo login check
  const demoLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'demo@pocketsmart.ai', password: 'Demo@123' },
  });
  console.log("Demo Login:", demoLogin.status, demoLogin.data.success ? "SUCCESS" : "FAIL");
  if (demoLogin.status !== 200 || !demoLogin.data.data?.token) throw new Error("Demo login failed");
  const demoToken = demoLogin.data.data.token;

  // 3. Register a new user
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  const registerRes = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Test Engineer',
      email: uniqueEmail,
      password: 'Password123',
      confirm_password: 'Password123',
    },
  });
  console.log("New User Registration:", registerRes.status, registerRes.data.success ? "SUCCESS" : "FAIL");
  if (registerRes.status !== 201) throw new Error("Registration failed");
  const newUserToken = registerRes.data.data.token;

  // 4. Unauthorized rejection check
  const unauthRes = await request('/api/dashboard');
  console.log("Unauthorized Rejection:", unauthRes.status === 401 ? "PASS (401)" : "FAIL");
  if (unauthRes.status !== 401) throw new Error("Unauthorized endpoint was not rejected");

  // 5. Add income for new user
  const addIncRes = await request('/api/income', {
    method: 'POST',
    headers: { Authorization: `Bearer ${newUserToken}` },
    body: {
      amount: 60000,
      source: 'Monthly Salary',
      date: new Date().toISOString().split('T')[0],
      description: 'Engineering payroll',
    },
  });
  console.log("Add Income:", addIncRes.status, addIncRes.data.success ? "SUCCESS" : "FAIL");
  if (addIncRes.status !== 201) throw new Error("Add income failed");

  // 6. Set Food Budget: ₹3000
  const addBudgetRes = await request('/api/budgets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${newUserToken}` },
    body: {
      category_id: 1, // Food
      amount: 3000,
    },
  });
  console.log("Set Budget:", addBudgetRes.status, addBudgetRes.data.success ? "SUCCESS" : "FAIL");
  if (addBudgetRes.status !== 201 && addBudgetRes.status !== 200) throw new Error("Set budget failed");

  // 7. Add expense within budget warning threshold (₹2700 -> 90% -> warning)
  const addExp1Res = await request('/api/expenses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${newUserToken}` },
    body: {
      category_id: 1,
      amount: 2700,
      description: 'Supermarket Dinner Supplies',
      payment_method: 'UPI',
    },
  });
  console.log("Add Expense (Warning Level):", addExp1Res.status, addExp1Res.data.success ? "SUCCESS" : "FAIL");

  // 8. Check Dashboard for new user
  const dashRes = await request('/api/dashboard', {
    headers: { Authorization: `Bearer ${newUserToken}` },
  });
  console.log("Dashboard Metrics:", dashRes.data.data.summary);
  if (dashRes.data.data.summary.total_income !== 60000 || dashRes.data.data.summary.total_expenses !== 2700) {
    throw new Error("Dashboard calculations mismatch");
  }

  // 9. Add expense exceeding budget (additional ₹500 -> total ₹3200 > ₹3000)
  const addExp2Res = await request('/api/expenses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${newUserToken}` },
    body: {
      category_id: 1,
      amount: 500,
      description: 'Dessert bakery',
      payment_method: 'Cash',
    },
  });
  console.log("Add Expense (Exceeded Level):", addExp2Res.status, addExp2Res.data.success ? "SUCCESS" : "FAIL");

  // 10. Check Budgets for Exceeded status
  const budgetListRes = await request('/api/budgets', {
    headers: { Authorization: `Bearer ${newUserToken}` },
  });
  const foodBudget = budgetListRes.data.data.find((b: any) => b.category_id === 1);
  console.log("Food Budget Status:", foodBudget.status, `(${foodBudget.spent} / ${foodBudget.amount})`);
  if (foodBudget.status !== 'exceeded') throw new Error("Expected budget status 'exceeded'");

  // 11. Assistant query with real user financial data
  const assistantRes = await request('/api/assistant', {
    method: 'POST',
    headers: { Authorization: `Bearer ${newUserToken}` },
    body: { message: "Am I exceeding my budget?" },
  });
  console.log("Assistant Response (Budget Exceeded query):", assistantRes.data.data.answer);
  if (!assistantRes.data.data.answer.includes("exceeded")) throw new Error("Assistant did not report budget exceeded");

  const assistantSpendRes = await request('/api/assistant', {
    method: 'POST',
    headers: { Authorization: `Bearer ${newUserToken}` },
    body: { message: "How much did I spend this month?" },
  });
  console.log("Assistant Response (Total spend query):", assistantSpendRes.data.data.answer);
  if (!assistantSpendRes.data.data.answer.includes("3,200")) throw new Error("Assistant did not report 3,200 spent");

  // 12. Tenant data isolation check: User 2 cannot access User 1 expense
  const user1ExpenseId = addExp1Res.data.data.id;
  const isolationCheck = await request(`/api/expenses/${user1ExpenseId}`, {
    headers: { Authorization: `Bearer ${demoToken}` },
  });
  console.log("Tenant Isolation Check (User B accessing User A expense):", isolationCheck.status === 404 ? "PASS (404 Not Found)" : "FAIL");
  if (isolationCheck.status !== 404) throw new Error("Tenant isolation failed");

  console.log("\nALL VERIFICATIONS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
