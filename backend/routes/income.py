from datetime import date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.income import Income
from backend.utils.validators import (
    success_response,
    error_response,
    is_valid_number,
    parse_date,
)

income_bp = Blueprint("income", __name__, url_prefix="/api/income")

@income_bp.route("", methods=["GET"])
@jwt_required()
def get_incomes():
    user_id = int(get_jwt_identity())
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    query = Income.query.filter_by(user_id=user_id)
    if year:
        # Filter by year
        query = query.filter(db.extract("year", Income.date) == year)
    if month:
        query = query.filter(db.extract("month", Income.date) == month)

    incomes = query.order_by(Income.date.desc(), Income.id.desc()).all()
    return success_response(data=[inc.to_dict() for inc in incomes])

@income_bp.route("", methods=["POST"])
@jwt_required()
def add_income():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    amount = data.get("amount")
    source = (data.get("source") or "").strip()
    date_str = data.get("date")
    description = (data.get("description") or "").strip()

    if not is_valid_number(amount) or float(amount) <= 0:
        return error_response("Amount must be a positive number", 400)

    if not source:
        return error_response("Income source is required", 400)

    inc_date = parse_date(date_str) if date_str else date.today()
    if not inc_date:
        return error_response("Invalid date format. Use YYYY-MM-DD", 400)

    income = Income(
        user_id=user_id,
        amount=float(amount),
        source=source,
        date=inc_date,
        description=description,
    )
    db.session.add(income)
    db.session.commit()

    return success_response(data=income.to_dict(), message="Income added successfully", code=201)

@income_bp.route("/<int:income_id>", methods=["PUT"])
@jwt_required()
def update_income(income_id):
    user_id = int(get_jwt_identity())
    income = Income.query.filter_by(id=income_id, user_id=user_id).first()

    if not income:
        return error_response("Income entry not found", 404)

    data = request.get_json(silent=True) or {}

    if "amount" in data:
        if not is_valid_number(data["amount"]) or float(data["amount"]) <= 0:
            return error_response("Amount must be a positive number", 400)
        income.amount = float(data["amount"])

    if "source" in data:
        source = (data.get("source") or "").strip()
        if not source:
            return error_response("Source cannot be empty", 400)
        income.source = source

    if "date" in data and data["date"]:
        inc_date = parse_date(data["date"])
        if not inc_date:
            return error_response("Invalid date format", 400)
        income.date = inc_date

    if "description" in data:
        income.description = (data.get("description") or "").strip()

    db.session.commit()
    return success_response(data=income.to_dict(), message="Income updated successfully")

@income_bp.route("/<int:income_id>", methods=["DELETE"])
@jwt_required()
def delete_income(income_id):
    user_id = int(get_jwt_identity())
    income = Income.query.filter_by(id=income_id, user_id=user_id).first()

    if not income:
        return error_response("Income entry not found", 404)

    db.session.delete(income)
    db.session.commit()
    return success_response(message="Income deleted successfully")
