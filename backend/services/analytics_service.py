from datetime import date, datetime
from typing import Dict, Any, List
from collections import defaultdict
from backend.services.prediction_service import PredictionService

class AnalyticsService:
    """
    Financial analytics service providing deterministic calculation
    of totals, cash flows, category allocations, and budget progress.
    """

    @staticmethod
    def calculate_summary(incomes: List[Any], expenses: List[Any], budgets: List[Any]) -> Dict[str, Any]:
        total_income = sum(float(inc.amount) for inc in incomes)
        total_expenses = sum(float(exp.amount) for exp in expenses)
        total_budget = sum(float(b.amount) for b in budgets)

        remaining_balance = total_income - total_expenses
        savings = remaining_balance  # In standard budgeting: remaining balance is net monthly savings

        if total_income > 0:
            savings_percentage = round((savings / total_income) * 100, 1)
        else:
            savings_percentage = 0.0

        if total_budget > 0:
            budget_utilization = round((total_expenses / total_budget) * 100, 1)
        else:
            budget_utilization = 0.0

        return {
            "total_income": round(total_income, 2),
            "total_expenses": round(total_expenses, 2),
            "remaining_balance": round(remaining_balance, 2),
            "savings": round(savings, 2),
            "savings_percentage": savings_percentage,
            "total_budget": round(total_budget, 2),
            "budget_utilization": budget_utilization,
        }

    @staticmethod
    def calculate_category_breakdown(expenses: List[Any], budgets: List[Any] = None) -> List[Dict[str, Any]]:
        category_spent = defaultdict(float)
        category_counts = defaultdict(int)
        budget_map = {}

        if budgets:
            for b in budgets:
                cat_name = b.category.name if b.category else "Other"
                budget_map[cat_name] = float(b.amount)

        total_spent = 0.0
        for exp in expenses:
            cat_name = exp.category.name if exp.category else "Other"
            amt = float(exp.amount)
            category_spent[cat_name] += amt
            category_counts[cat_name] += 1
            total_spent += amt

        result = []
        for cat_name, spent in category_spent.items():
            percentage = round((spent / total_spent * 100), 1) if total_spent > 0 else 0.0
            budget_amt = budget_map.get(cat_name, 0.0)
            utilization = round((spent / budget_amt * 100), 1) if budget_amt > 0 else 0.0

            result.append({
                "category": cat_name,
                "spent": round(spent, 2),
                "count": category_counts[cat_name],
                "percentage": percentage,
                "budget": round(budget_amt, 2),
                "budget_utilization": utilization,
                "is_over_budget": (spent > budget_amt) if budget_amt > 0 else False,
            })

        # Sort descending by spent
        result.sort(key=lambda x: x["spent"], reverse=True)
        return result

    @staticmethod
    def calculate_cashflow_trends(incomes: List[Any], expenses: List[Any]) -> List[Dict[str, Any]]:
        # Group by YYYY-MM
        monthly_data = defaultdict(lambda: {"income": 0.0, "expense": 0.0})

        for inc in incomes:
            month_key = inc.date.strftime("%Y-%m") if hasattr(inc, "date") and inc.date else "Unknown"
            monthly_data[month_key]["income"] += float(inc.amount)

        for exp in expenses:
            month_key = exp.expense_date.strftime("%Y-%m") if hasattr(exp, "expense_date") and exp.expense_date else "Unknown"
            monthly_data[month_key]["expense"] += float(exp.amount)

        # Sort chronological
        sorted_keys = sorted(monthly_data.keys())
        trends = []
        for key in sorted_keys:
            inc = round(monthly_data[key]["income"], 2)
            exp = round(monthly_data[key]["expense"], 2)
            net = round(inc - exp, 2)
            trends.append({
                "month": key,
                "income": inc,
                "expense": exp,
                "net_savings": net,
            })

        return trends
