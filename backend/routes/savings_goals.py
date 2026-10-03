from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.savings_goal import SavingsGoal
from backend.utils.validators import (
    success_response,
    error_response,
    is_valid_number,
    parse_date,
)

savings_goals_bp = Blueprint("savings_goals", __name__, url_prefix="/api/savings-goals")

@savings_goals_bp.route("", methods=["GET"])
@jwt_required()
def get_savings_goals():
    user_id = int(get_jwt_identity())
    goals = SavingsGoal.query.filter_by(user_id=user_id).order_by(SavingsGoal.target_date.asc()).all()
    return success_response(data=[goal.to_dict() for goal in goals])

@savings_goals_bp.route("", methods=["POST"])
@jwt_required()
def create_savings_goal():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    target_amount = data.get("target_amount")
    current_amount = data.get("current_amount", 0.0)
    target_date_str = data.get("target_date")
    description = (data.get("description") or "").strip()

    if not name:
        return error_response("Goal name is required", 400)

    if not is_valid_number(target_amount) or float(target_amount) <= 0:
        return error_response("Target amount must be a positive number", 400)

    if not is_valid_number(current_amount) or float(current_amount) < 0:
        return error_response("Current amount cannot be negative", 400)

    target_date = parse_date(target_date_str)
    if not target_date:
        return error_response("Valid target date required (YYYY-MM-DD)", 400)

    goal = SavingsGoal(
        user_id=user_id,
        name=name,
        target_amount=float(target_amount),
        current_amount=float(current_amount),
        target_date=target_date,
        description=description,
    )
    db.session.add(goal)
    db.session.commit()

    return success_response(data=goal.to_dict(), message="Savings goal created", code=201)

@savings_goals_bp.route("/<int:goal_id>", methods=["PUT"])
@jwt_required()
def update_savings_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal = SavingsGoal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return error_response("Savings goal not found", 404)

    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return error_response("Goal name cannot be empty", 400)
        goal.name = name

    if "target_amount" in data:
        if not is_valid_number(data["target_amount"]) or float(data["target_amount"]) <= 0:
            return error_response("Target amount must be a positive number", 400)
        goal.target_amount = float(data["target_amount"])

    # Allow adding money directly or updating current_amount
    if "add_amount" in data:
        add_amt = data["add_amount"]
        if not is_valid_number(add_amt) or float(add_amt) <= 0:
            return error_response("Amount to add must be positive", 400)
        goal.current_amount = float(goal.current_amount) + float(add_amt)
    elif "current_amount" in data:
        if not is_valid_number(data["current_amount"]) or float(data["current_amount"]) < 0:
            return error_response("Current amount cannot be negative", 400)
        goal.current_amount = float(data["current_amount"])

    if "target_date" in data and data["target_date"]:
        dt = parse_date(data["target_date"])
        if not dt:
            return error_response("Invalid target date format", 400)
        goal.target_date = dt

    if "description" in data:
        goal.description = (data.get("description") or "").strip()

    db.session.commit()
    return success_response(data=goal.to_dict(), message="Savings goal updated")

@savings_goals_bp.route("/<int:goal_id>", methods=["DELETE"])
@jwt_required()
def delete_savings_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal = SavingsGoal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return error_response("Savings goal not found", 404)

    db.session.delete(goal)
    db.session.commit()
    return success_response(message="Savings goal deleted")
