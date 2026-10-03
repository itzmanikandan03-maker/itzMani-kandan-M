from datetime import date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.budget import Budget
from backend.models.category import Category
from backend.models.expense import Expense
from backend.utils.validators import (
    success_response,
    error_response,
    is_valid_number,
)

budgets_bp = Blueprint("budgets", __name__, url_prefix="/api/budgets")

@budgets_bp.route("", methods=["GET"])
@jwt_required()
def get_budgets():
    user_id = int(get_jwt_identity())
    today = date.today()
    month = request.args.get("month", today.month, type=int)
    year = request.args.get("year", today.year, type=int)

    budgets = Budget.query.filter_by(user_id=user_id, month=month, year=year).all()

    # Calculate actual spent for each budget category in this month/year
    result = []
    for b in budgets:
        spent_sum = db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0.0))\
            .filter(
                Expense.user_id == user_id,
                Expense.category_id == b.category_id,
                db.extract("month", Expense.expense_date) == month,
                db.extract("year", Expense.expense_date) == year
            ).scalar()

        spent = float(spent_sum or 0.0)
        budget_amt = float(b.amount)
        utilization = round((spent / budget_amt * 100), 1) if budget_amt > 0 else 0.0
        remaining = round(budget_amt - spent, 2)

        status = "normal"
        if spent > budget_amt:
            status = "exceeded"
        elif utilization >= 80.0:
            status = "warning"

        b_dict = b.to_dict()
        b_dict["spent"] = spent
        b_dict["remaining"] = remaining
        b_dict["utilization_percentage"] = utilization
        b_dict["status"] = status
        result.append(b_dict)

    return success_response(data=result)

@budgets_bp.route("", methods=["POST"])
@jwt_required()
def create_or_update_budget():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    category_id = data.get("category_id")
    amount = data.get("amount")
    today = date.today()
    month = data.get("month", today.month)
    year = data.get("year", today.year)

    if not category_id:
        return error_response("Category ID is required", 400)

    cat = Category.query.get(category_id)
    if not cat:
        return error_response("Category does not exist", 400)

    if not is_valid_number(amount) or float(amount) <= 0:
        return error_response("Budget amount must be a positive number", 400)

    # Check for existing budget for user + category + month + year
    budget = Budget.query.filter_by(
        user_id=user_id,
        category_id=category_id,
        month=int(month),
        year=int(year)
    ).first()

    if budget:
        # Update existing
        budget.amount = float(amount)
        db.session.commit()
        return success_response(data=budget.to_dict(), message="Budget updated successfully")
    else:
        # Create new
        budget = Budget(
            user_id=user_id,
            category_id=category_id,
            amount=float(amount),
            month=int(month),
            year=int(year)
        )
        db.session.add(budget)
        db.session.commit()
        return success_response(data=budget.to_dict(), message="Budget created successfully", code=201)

@budgets_bp.route("/<int:budget_id>", methods=["PUT"])
@jwt_required()
def update_budget(budget_id):
    user_id = int(get_jwt_identity())
    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    if not budget:
        return error_response("Budget not found", 404)

    data = request.get_json(silent=True) or {}
    if "amount" in data:
        if not is_valid_number(data["amount"]) or float(data["amount"]) <= 0:
            return error_response("Amount must be a positive number", 400)
        budget.amount = float(data["amount"])

    db.session.commit()
    return success_response(data=budget.to_dict(), message="Budget updated successfully")

@budgets_bp.route("/<int:budget_id>", methods=["DELETE"])
@jwt_required()
def delete_budget(budget_id):
    user_id = int(get_jwt_identity())
    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    if not budget:
        return error_response("Budget not found", 404)

    db.session.delete(budget)
    db.session.commit()
    return success_response(message="Budget deleted successfully")
