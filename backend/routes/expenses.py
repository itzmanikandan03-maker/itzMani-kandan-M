from datetime import date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.expense import Expense
from backend.models.category import Category
from backend.services.categorization_service import CategorizationService
from backend.utils.validators import (
    success_response,
    error_response,
    is_valid_number,
    parse_date,
)

expenses_bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")

@expenses_bp.route("", methods=["GET"])
@jwt_required()
def get_expenses():
    user_id = int(get_jwt_identity())

    # Filter params
    category_id = request.args.get("category_id", type=int)
    category_name = request.args.get("category")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    payment_method = request.args.get("payment_method")
    min_amount = request.args.get("min_amount", type=float)
    max_amount = request.args.get("max_amount", type=float)
    search = request.args.get("search")

    # Sorting & Pagination
    sort_by = request.args.get("sort", "date_desc")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    query = Expense.query.filter_by(user_id=user_id)

    if category_id:
        query = query.filter(Expense.category_id == category_id)
    elif category_name:
        query = query.join(Category).filter(Category.name.ilike(f"%{category_name}%"))

    if start_date:
        parsed_s = parse_date(start_date)
        if parsed_s:
            query = query.filter(Expense.expense_date >= parsed_s)

    if end_date:
        parsed_e = parse_date(end_date)
        if parsed_e:
            query = query.filter(Expense.expense_date <= parsed_e)

    if year:
        query = query.filter(db.extract("year", Expense.expense_date) == year)
    if month:
        query = query.filter(db.extract("month", Expense.expense_date) == month)

    if payment_method:
        query = query.filter(Expense.payment_method == payment_method)

    if min_amount is not None:
        query = query.filter(Expense.amount >= min_amount)

    if max_amount is not None:
        query = query.filter(Expense.amount <= max_amount)

    if search:
        query = query.filter(Expense.description.ilike(f"%{search}%"))

    # Sorting
    if sort_by == "date_asc":
        query = query.order_by(Expense.expense_date.asc(), Expense.id.asc())
    elif sort_by == "amount_desc":
        query = query.order_by(Expense.amount.desc(), Expense.id.desc())
    elif sort_by == "amount_asc":
        query = query.order_by(Expense.amount.asc(), Expense.id.asc())
    else: # default date_desc
        query = query.order_by(Expense.expense_date.desc(), Expense.id.desc())

    total_count = query.count()
    paginated_items = query.paginate(page=page, per_page=per_page, error_out=False)

    return success_response(data={
        "expenses": [exp.to_dict() for exp in paginated_items.items],
        "total": total_count,
        "page": page,
        "per_page": per_page,
        "total_pages": paginated_items.pages,
    })

@expenses_bp.route("/<int:expense_id>", methods=["GET"])
@jwt_required()
def get_expense_by_id(expense_id):
    user_id = int(get_jwt_identity())
    expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
    if not expense:
        return error_response("Expense not found", 404)
    return success_response(data=expense.to_dict())

@expenses_bp.route("", methods=["POST"])
@jwt_required()
def add_expense():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    amount = data.get("amount")
    description = (data.get("description") or "").strip()
    category_id = data.get("category_id")
    payment_method = (data.get("payment_method") or "UPI").strip()
    date_str = data.get("expense_date") or data.get("date")

    if not is_valid_number(amount) or float(amount) <= 0:
        return error_response("Amount must be a positive number", 400)

    if not description:
        return error_response("Description is required", 400)

    # If category_id not provided, predict via categorization service!
    if not category_id:
        predicted_name = CategorizationService.predict_category(description)
        cat = Category.query.filter(Category.name.ilike(predicted_name)).first()
        if not cat:
            cat = Category.query.filter_by(name="Other").first()
        category_id = cat.id if cat else 1
    else:
        # Validate category exists
        cat = Category.query.get(category_id)
        if not cat:
            return error_response("Selected category does not exist", 400)

    exp_date = parse_date(date_str) if date_str else date.today()
    if not exp_date:
        return error_response("Invalid date format. Use YYYY-MM-DD", 400)

    valid_methods = ["Cash", "UPI", "Credit Card", "Debit Card", "Bank Transfer", "Other"]
    if payment_method not in valid_methods:
        payment_method = "Other"

    expense = Expense(
        user_id=user_id,
        category_id=category_id,
        amount=float(amount),
        description=description,
        payment_method=payment_method,
        expense_date=exp_date,
    )
    db.session.add(expense)
    db.session.commit()

    return success_response(data=expense.to_dict(), message="Expense created successfully", code=201)

@expenses_bp.route("/<int:expense_id>", methods=["PUT"])
@jwt_required()
def update_expense(expense_id):
    user_id = int(get_jwt_identity())
    expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
    if not expense:
        return error_response("Expense not found", 404)

    data = request.get_json(silent=True) or {}

    if "amount" in data:
        if not is_valid_number(data["amount"]) or float(data["amount"]) <= 0:
            return error_response("Amount must be a positive number", 400)
        expense.amount = float(data["amount"])

    if "description" in data:
        desc = (data.get("description") or "").strip()
        if not desc:
            return error_response("Description cannot be empty", 400)
        expense.description = desc

    if "category_id" in data:
        cat = Category.query.get(data["category_id"])
        if not cat:
            return error_response("Invalid category", 400)
        expense.category_id = cat.id

    if "payment_method" in data:
        expense.payment_method = data["payment_method"]

    if "expense_date" in data and data["expense_date"]:
        dt = parse_date(data["expense_date"])
        if not dt:
            return error_response("Invalid date format", 400)
        expense.expense_date = dt

    db.session.commit()
    return success_response(data=expense.to_dict(), message="Expense updated successfully")

@expenses_bp.route("/<int:expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    user_id = int(get_jwt_identity())
    expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
    if not expense:
        return error_response("Expense not found", 404)

    db.session.delete(expense)
    db.session.commit()
    return success_response(message="Expense deleted successfully")

@expenses_bp.route("/categorize", methods=["POST"])
@jwt_required()
def suggest_category():
    data = request.get_json(silent=True) or {}
    description = data.get("description", "")
    predicted_category = CategorizationService.predict_category(description)
    cat = Category.query.filter(Category.name.ilike(predicted_category)).first()
    return success_response(data={
        "category_name": predicted_category,
        "category_id": cat.id if cat else None
    })
