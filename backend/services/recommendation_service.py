from typing import List, Dict, Any

class RecommendationService:
    """
    Deterministic rule-based recommendation engine.
    Analyzes user financial metrics and generates actionable, prioritized suggestions.
    Note: These are informational budgeting tips, not certified financial advice.
    """

    @classmethod
    def generate_recommendations(
        cls,
        current_income: float,
        current_expenses: float,
        category_spending: List[Dict[str, Any]], # [{"category": "Food", "spent": 2500, "budget": 2000}]
        previous_month_expenses: float = 0.0,
        savings_goals: List[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        recs = []

        # 1. Budget Exceeded & Warning checks per category
        for cat in category_spending:
            cat_name = cat.get("category", "General")
            spent = float(cat.get("spent", 0.0))
            budget = float(cat.get("budget", 0.0))

            if budget > 0:
                if spent > budget:
                    over_amount = round(spent - budget, 2)
                    recs.append({
                        "type": "budget_exceeded",
                        "title": f"Budget Exceeded: {cat_name}",
                        "message": f"Your {cat_name} spending is ₹{over_amount:,.2f} above your monthly budget. Consider cutting non-essential expenses in this area.",
                        "priority": "high",
                    })
                elif spent >= (0.80 * budget):
                    pct = round((spent / budget) * 100, 1)
                    remaining = round(budget - spent, 2)
                    recs.append({
                        "type": "budget_warning",
                        "title": f"Budget Alert: {cat_name}",
                        "message": f"Your {cat_name} budget is almost exhausted ({pct}% used, ₹{remaining:,.2f} remaining). Monitor upcoming expenses carefully.",
                        "priority": "medium",
                    })

        # 2. Highest Spending Category
        if category_spending and current_expenses > 0:
            sorted_cats = sorted(category_spending, key=lambda x: x.get("spent", 0.0), reverse=True)
            top_cat = sorted_cats[0]
            top_spent = float(top_cat.get("spent", 0.0))
            if top_spent > 0:
                pct_of_total = round((top_spent / current_expenses) * 100, 1)
                if pct_of_total >= 30:
                    recs.append({
                        "type": "highest_spending",
                        "title": f"Major Expense Area: {top_cat.get('category')}",
                        "message": f"{top_cat.get('category')} accounts for {pct_of_total}% (₹{top_spent:,.2f}) of your total monthly spending.",
                        "priority": "medium" if pct_of_total < 50 else "high",
                    })

        # 3. Monthly Expense Comparison (Increasing or Decreasing)
        if previous_month_expenses > 0 and current_expenses > 0:
            diff = current_expenses - previous_month_expenses
            pct_change = round(abs(diff) / previous_month_expenses * 100, 1)
            if diff > (0.15 * previous_month_expenses):
                recs.append({
                    "type": "spending_increase",
                    "title": "Spending Increased",
                    "message": f"Your expenses increased by {pct_change}% (₹{diff:,.2f}) compared to last month. Review recent purchases to maintain control.",
                    "priority": "medium",
                })
            elif diff < (-0.10 * previous_month_expenses):
                # Positive behavior rule
                recs.append({
                    "type": "positive_behavior",
                    "title": "Great Progress on Expenses",
                    "message": f"Your spending decreased by {pct_change}% compared to this time last month! Keep up the disciplined budgeting habit.",
                    "priority": "low",
                })

        # 4. Savings Rate Analysis
        if current_income > 0:
            savings = current_income - current_expenses
            savings_rate = (savings / current_income) * 100
            if savings < 0:
                deficit = abs(savings)
                recs.append({
                    "type": "negative_cashflow",
                    "title": "Spending Exceeds Income",
                    "message": f"You are currently running a monthly deficit of ₹{deficit:,.2f}. Prioritize necessary expenses until balance recovers.",
                    "priority": "high",
                })
            elif savings_rate < 15.0:
                recs.append({
                    "type": "low_savings",
                    "title": "Low Savings Rate",
                    "message": f"Your current savings rate is {savings_rate:.1f}%. Aiming for at least 20% can help build a robust financial cushion.",
                    "priority": "medium",
                })
            elif savings_rate >= 30.0:
                recs.append({
                    "type": "healthy_savings",
                    "title": "Strong Savings Habit",
                    "message": f"Outstanding! You are saving {savings_rate:.1f}% of your monthly income. Consider allocating some toward your savings goals or an emergency fund.",
                    "priority": "low",
                })

        # 5. Savings Goals Check
        if savings_goals:
            for goal in savings_goals:
                current_amt = float(goal.get("current_amount", 0.0))
                target_amt = float(goal.get("target_amount", 0.0))
                name = goal.get("name", "Goal")
                if target_amt > 0:
                    pct = (current_amt / target_amt) * 100
                    if pct >= 100:
                        recs.append({
                            "type": "goal_completed",
                            "title": f"Goal Achieved: {name}",
                            "message": f"Congratulations! You reached your goal '{name}' (₹{current_amt:,.2f} saved).",
                            "priority": "low",
                        })
                    elif pct < 25 and current_income > current_expenses:
                        recs.append({
                            "type": "goal_boost",
                            "title": f"Boost Goal: {name}",
                            "message": f"You have saved {pct:.1f}% toward '{name}'. Allocating a small portion of your remaining monthly balance can speed up completion.",
                            "priority": "low",
                        })

        return recs
