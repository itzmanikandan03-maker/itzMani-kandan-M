from datetime import date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.income import Income
from backend.models.expense import Expense
from backend.models.budget import Budget
from backend.services.analytics_service import AnalyticsService
from backend.services.prediction_service import PredictionService
from backend.utils.validators import success_response

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/monthly", methods=["GET"])
@jwt_required()
def get_monthly_summary():
    user_id = int(get_jwt_identity())
    today = date.today()
    month = request.args.get("month", today.month, type=int)
    year = request.args.get("year", today.year, type=int)

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

    summary = AnalyticsService.calculate_summary(incomes, expenses, budgets)
    summary["month"] = month
    summary["year"] = year

    return success_response(data=summary)

@analytics_bp.route("/categories", methods=["GET"])
@jwt_required()
def get_category_breakdown():
    user_id = int(get_jwt_identity())
    today = date.today()
    month = request.args.get("month", today.month, type=int)
    year = request.args.get("year", today.year, type=int)

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

    breakdown = AnalyticsService.calculate_category_breakdown(expenses, budgets)
    return success_response(data=breakdown)

@analytics_bp.route("/trends", methods=["GET"])
@jwt_required()
def get_trends():
    user_id = int(get_jwt_identity())
    incomes = Income.query.filter_by(user_id=user_id).all()
    expenses = Expense.query.filter_by(user_id=user_id).all()

    trends = AnalyticsService.calculate_cashflow_trends(incomes, expenses)
    return success_response(data=trends)

@analytics_bp.route("/cashflow", methods=["GET"])
@jwt_required()
def get_cashflow():
    user_id = int(get_jwt_identity())
    today = date.today()
    month = request.args.get("month", today.month, type=int)
    year = request.args.get("year", today.year, type=int)

    inc_sum = db.session.query(db.func.coalesce(db.func.sum(Income.amount), 0.0)).filter(
        Income.user_id == user_id,
        db.extract("month", Income.date) == month,
        db.extract("year", Income.date) == year
    ).scalar()

    exp_sum = db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0.0)).filter(
        Expense.user_id == user_id,
        db.extract("month", Expense.expense_date) == month,
        db.extract("year", Expense.expense_date) == year
    ).scalar()

    total_income = float(inc_sum or 0.0)
    total_expense = float(exp_sum or 0.0)
    net_cashflow = round(total_income - total_expense, 2)

    return success_response(data={
        "month": month,
        "year": year,
        "total_income": total_income,
        "total_expense": total_expense,
        "net_cashflow": net_cashflow,
        "is_positive": net_cashflow >= 0
    })

@analytics_bp.route("/prediction", methods=["GET"])
@jwt_required()
def get_prediction():
    user_id = int(get_jwt_identity())
    today = date.today()
    month = today.month
    year = today.year

    # Current month expenses
    exp_sum = db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0.0)).filter(
        Expense.user_id == user_id,
        db.extract("month", Expense.expense_date) == month,
        db.extract("year", Expense.expense_date) == year
    ).scalar()

    # Total budget
    budget_sum = db.session.query(db.func.coalesce(db.func.sum(Budget.amount), 0.0)).filter(
        Budget.user_id == user_id,
        Budget.month == month,
        Budget.year == year
    ).scalar()

    prediction = PredictionService.calculate_month_prediction(
        current_expenses=float(exp_sum or 0.0),
        current_date=today,
        monthly_budget=float(budget_sum or 0.0)
    )

    return success_response(data=prediction)
