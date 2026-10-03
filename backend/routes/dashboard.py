from datetime import date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.income import Income
from backend.models.expense import Expense
from backend.models.budget import Budget
from backend.models.savings_goal import SavingsGoal
from backend.models.recommendation import Recommendation
from backend.services.analytics_service import AnalyticsService
from backend.services.prediction_service import PredictionService
from backend.routes.recommendations import generate_user_recommendations
from backend.utils.validators import success_response

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("", methods=["GET"])
@jwt_required()
def get_dashboard_data():
    user_id = int(get_jwt_identity())
    today = date.today()
    month = request.args.get("month", today.month, type=int)
    year = request.args.get("year", today.year, type=int)

    # 1. Fetch Incomes & Expenses for given month
    incomes = Income.query.filter(
        Income.user_id == user_id,
        db.extract("month", Income.date) == month,
        db.extract("year", Income.date) == year
    ).all()

    expenses = Expense.query.filter(
        Expense.user_id == user_id,
        db.extract("month", Expense.expense_date) == month,
        db.extract("year", Expense.expense_date) == year
    ).all()

    budgets = Budget.query.filter(
        Budget.user_id == user_id,
        Budget.month == month,
        Budget.year == year
    ).all()

    # 2. Financial Summary
    summary = AnalyticsService.calculate_summary(incomes, expenses, budgets)

    # 3. Category Breakdown
    category_breakdown = AnalyticsService.calculate_category_breakdown(expenses, budgets)

    # 4. Recent Transactions (latest 8 expenses)
    recent_expenses = Expense.query.filter_by(user_id=user_id)\
        .order_by(Expense.expense_date.desc(), Expense.id.desc())\
        .limit(8).all()

    # 5. Budgets with Progress
    budget_status = []
    for b in budgets:
        spent_for_cat = sum(float(e.amount) for e in expenses if e.category_id == b.category_id)
        budget_amt = float(b.amount)
        utilization = round((spent_for_cat / budget_amt * 100), 1) if budget_amt > 0 else 0.0
        status = "normal"
        if spent_for_cat > budget_amt:
            status = "exceeded"
        elif utilization >= 80.0:
            status = "warning"

        b_data = b.to_dict()
        b_data["spent"] = round(spent_for_cat, 2)
        b_data["remaining"] = round(budget_amt - spent_for_cat, 2)
        b_data["utilization_percentage"] = utilization
        b_data["status"] = status
        budget_status.append(b_data)

    # 6. Savings Goals
    savings_goals = SavingsGoal.query.filter_by(user_id=user_id).order_by(SavingsGoal.target_date.asc()).all()

    # 7. Recommendations
    generate_user_recommendations(user_id)
    recommendations = Recommendation.query.filter_by(user_id=user_id)\
        .order_by(Recommendation.is_read.asc(), Recommendation.id.desc())\
        .limit(5).all()

    # 8. Spending Prediction
    prediction = PredictionService.calculate_month_prediction(
        current_expenses=summary["total_expenses"],
        current_date=today,
        monthly_budget=summary["total_budget"]
    )

    return success_response(data={
        "summary": summary,
        "category_breakdown": category_breakdown,
        "recent_expenses": [e.to_dict() for e in recent_expenses],
        "budget_status": budget_status,
        "savings_goals": [g.to_dict() for g in savings_goals],
        "recommendations": [r.to_dict() for r in recommendations],
        "prediction": prediction,
        "current_month": month,
        "current_year": year,
    })
