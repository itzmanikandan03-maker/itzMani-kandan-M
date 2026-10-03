import re
from datetime import date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.income import Income
from backend.models.expense import Expense
from backend.models.budget import Budget
from backend.models.category import Category
from backend.models.savings_goal import SavingsGoal
from backend.services.analytics_service import AnalyticsService
from backend.services.prediction_service import PredictionService
from backend.utils.validators import success_response, error_response

assistant_bp = Blueprint("assistant", __name__, url_prefix="/api/assistant")

def answer_financial_query(user_id: int, query_text: str) -> dict:
    today = date.today()
    curr_month = today.month
    curr_year = today.year
    prev_month = 12 if curr_month == 1 else curr_month - 1
    prev_year = curr_year - 1 if curr_month == 1 else curr_year

    q = (query_text or "").lower().strip()

    # Query current month income & expenses
    incomes = Income.query.filter(
        Income.user_id == user_id,
        db.extract("month", Income.date) == curr_month,
        db.extract("year", Income.date) == curr_year
    ).all()

    expenses = Expense.query.filter(
        Expense.user_id == user_id,
        db.extract("month", Expense.expense_date) == curr_month,
        db.extract("year", Expense.expense_date) == curr_year
    ).all()

    budgets = Budget.query.filter(
        Budget.user_id == user_id,
        Budget.month == curr_month,
        Budget.year == curr_year
    ).all()

    summary = AnalyticsService.calculate_summary(incomes, expenses, budgets)
    breakdown = AnalyticsService.calculate_category_breakdown(expenses, budgets)

    # 1. "What am I spending most on?" or "highest expense" or "top spending"
    if any(k in q for k in ["most on", "highest", "top spending", "biggest expense", "largest"]):
        if not breakdown or summary["total_expenses"] == 0:
            return {
                "answer": "You have recorded ₹0 in expenses for this month. Once you log transactions, I can show your highest spending category.",
                "data_points": {"total_expenses": 0}
            }
        top = breakdown[0]
        return {
            "answer": f"You are spending the most on **{top['category']}**, totaling **₹{top['spent']:,.2f}**, which represents **{top['percentage']}%** of your total monthly expenses.",
            "data_points": top
        }

    # 2. "How much did I spend this month?" or "total expenses" or "spent"
    if any(k in q for k in ["how much did i spend", "total spend", "total expenses", "spent this month", "monthly spend"]):
        return {
            "answer": f"This month ({today.strftime('%B %Y')}), your total spending is **₹{summary['total_expenses']:,.2f}** across {len(expenses)} recorded transactions.",
            "data_points": {
                "total_expenses": summary["total_expenses"],
                "transaction_count": len(expenses)
            }
        }

    # 3. "Am I exceeding my budget?" or "budget status" or "over budget"
    if any(k in q for k in ["exceeding", "over budget", "budget limit", "exceed my budget"]):
        over_budgets = [c for c in breakdown if c.get("is_over_budget")]
        warning_budgets = [c for c in breakdown if c.get("budget_utilization", 0) >= 80 and not c.get("is_over_budget")]

        if over_budgets:
            over_names = ", ".join(f"**{c['category']}** (₹{c['spent']:,.2f} of ₹{c['budget']:,.2f})" for c in over_budgets)
            return {
                "answer": f"⚠️ Yes, you have exceeded your budget in {len(over_budgets)} category(s): {over_names}.",
                "data_points": {"over_budgets": over_budgets}
            }
        elif warning_budgets:
            warn_names = ", ".join(f"**{c['category']}** ({c['budget_utilization']}%)" for c in warning_budgets)
            return {
                "answer": f"You haven't exceeded any budgets yet, but you are close in {len(warning_budgets)} category(s): {warn_names}.",
                "data_points": {"warning_budgets": warning_budgets}
            }
        elif summary["total_budget"] > 0:
            return {
                "answer": f"✅ Great news! You are within your budget limits. Total monthly budget utilization is **{summary['budget_utilization']}%** (₹{summary['total_expenses']:,.2f} of ₹{summary['total_budget']:,.2f}).",
                "data_points": {"utilization": summary["budget_utilization"]}
            }
        else:
            return {
                "answer": "You currently haven't set any monthly budgets. Head to the Budgets page to create spending limits for your categories.",
                "data_points": {}
            }

    # 4. "How much money do I have left?" or "remaining balance" or "balance"
    if any(k in q for k in ["have left", "remaining balance", "left to spend", "current balance", "remaining"]):
        return {
            "answer": f"Your remaining monthly balance is **₹{summary['remaining_balance']:,.2f}** (Total Income: ₹{summary['total_income']:,.2f} minus Total Expenses: ₹{summary['total_expenses']:,.2f}).",
            "data_points": {
                "remaining_balance": summary["remaining_balance"],
                "income": summary["total_income"],
                "expenses": summary["total_expenses"]
            }
        }

    # 5. "How much did I spend on [category]?" e.g., food, rent, shopping
    categories = Category.query.all()
    for cat in categories:
        if cat.name.lower() in q:
            # Found requested category
            cat_item = next((c for c in breakdown if c["category"].lower() == cat.name.lower()), None)
            spent = cat_item["spent"] if cat_item else 0.0
            budget_str = f" against a budget of ₹{cat_item['budget']:,.2f}" if cat_item and cat_item["budget"] > 0 else ""
            return {
                "answer": f"You have spent **₹{spent:,.2f}** on **{cat.name}** this month{budget_str}.",
                "data_points": cat_item or {"category": cat.name, "spent": 0}
            }

    # 6. "How much can I save?" or "savings" or "savings rate"
    if any(k in q for k in ["can i save", "how much can i save", "savings rate", "my savings"]):
        goals = SavingsGoal.query.filter_by(user_id=user_id).all()
        goals_text = ""
        if goals:
            goals_text = f" You also have {len(goals)} active savings goals."
        return {
            "answer": f"Based on your current cashflow, your net savings this month are **₹{summary['savings']:,.2f}**, representing a **{summary['savings_percentage']}%** savings rate.{goals_text}",
            "data_points": {"savings": summary["savings"], "rate": summary["savings_percentage"]}
        }

    # 7. "Which category increased the most?" or "compare last month"
    if any(k in q for k in ["increased", "compared to last month", "spending change", "more than last month"]):
        prev_cat_expenses = db.session.query(
            Expense.category_id,
            db.func.sum(Expense.amount).label("spent")
        ).filter(
            Expense.user_id == user_id,
            db.extract("month", Expense.expense_date) == prev_month,
            db.extract("year", Expense.expense_date) == prev_year
        ).group_by(Expense.category_id).all()

        prev_map = {item.category_id: float(item.spent or 0.0) for item in prev_cat_expenses}
        max_diff = -1
        max_cat_name = None

        for item in breakdown:
            c_obj = Category.query.filter_by(name=item["category"]).first()
            p_spent = prev_map.get(c_obj.id, 0.0) if c_obj else 0.0
            diff = item["spent"] - p_spent
            if diff > max_diff:
                max_diff = diff
                max_cat_name = item["category"]

        if max_cat_name and max_diff > 0:
            return {
                "answer": f"**{max_cat_name}** had the largest increase, up by **₹{max_diff:,.2f}** compared to last month.",
                "data_points": {"category": max_cat_name, "increase": round(max_diff, 2)}
            }
        else:
            return {
                "answer": "No categories have shown an increase over last month's spending, or there is not enough historical data yet.",
                "data_points": {}
            }

    # Default fallback using real summary metrics
    return {
        "answer": f"Here is your current financial summary for {today.strftime('%B %Y')}:\n"
                  f"• **Income**: ₹{summary['total_income']:,.2f}\n"
                  f"• **Expenses**: ₹{summary['total_expenses']:,.2f}\n"
                  f"• **Remaining Balance**: ₹{summary['remaining_balance']:,.2f}\n"
                  f"• **Budget Utilization**: {summary['budget_utilization']}%\n\n"
                  "You can ask me questions like: 'What am I spending most on?', 'Am I exceeding my budget?', 'How much did I spend on Food?', or 'How much can I save?'",
        "data_points": summary
    }

@assistant_bp.route("", methods=["POST"])
@jwt_required()
def ask_assistant():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or data.get("prompt") or "").strip()

    if not message:
        return error_response("Please provide a question or message", 400)

    result = answer_financial_query(user_id, message)
    return success_response(data=result)
