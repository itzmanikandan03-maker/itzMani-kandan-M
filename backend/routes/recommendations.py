from datetime import date
from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.recommendation import Recommendation
from backend.models.income import Income
from backend.models.expense import Expense
from backend.models.budget import Budget
from backend.models.category import Category
from backend.models.savings_goal import SavingsGoal
from backend.services.recommendation_service import RecommendationService
from backend.utils.validators import success_response, error_response

recommendations_bp = Blueprint("recommendations", __name__, url_prefix="/api/recommendations")

def generate_user_recommendations(user_id: int):
    today = date.today()
    curr_month = today.month
    curr_year = today.year

    prev_month = 12 if curr_month == 1 else curr_month - 1
    prev_year = curr_year - 1 if curr_month == 1 else curr_year

    # Current month income
    curr_inc = db.session.query(db.func.coalesce(db.func.sum(Income.amount), 0.0))\
        .filter(
            Income.user_id == user_id,
            db.extract("month", Income.date) == curr_month,
            db.extract("year", Income.date) == curr_year
        ).scalar()

    # Current month expenses
    curr_exp = db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0.0))\
        .filter(
            Expense.user_id == user_id,
            db.extract("month", Expense.expense_date) == curr_month,
            db.extract("year", Expense.expense_date) == curr_year
        ).scalar()

    # Previous month expenses
    prev_exp = db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0.0))\
        .filter(
            Expense.user_id == user_id,
            db.extract("month", Expense.expense_date) == prev_month,
            db.extract("year", Expense.expense_date) == prev_year
        ).scalar()

    # Category budgets
    budgets = Budget.query.filter_by(user_id=user_id, month=curr_month, year=curr_year).all()
    budget_map = {b.category_id: float(b.amount) for b in budgets}

    # Category spending
    cat_expenses = db.session.query(
        Expense.category_id,
        db.func.sum(Expense.amount).label("spent")
    ).filter(
        Expense.user_id == user_id,
        db.extract("month", Expense.expense_date) == curr_month,
        db.extract("year", Expense.expense_date) == curr_year
    ).group_by(Expense.category_id).all()

    category_spending = []
    seen_cats = set()

    for item in cat_expenses:
        cat = Category.query.get(item.category_id)
        cat_name = cat.name if cat else "Other"
        seen_cats.add(item.category_id)
        category_spending.append({
            "category": cat_name,
            "spent": float(item.spent or 0.0),
            "budget": budget_map.get(item.category_id, 0.0)
        })

    # Include budgets that had 0 spent
    for b in budgets:
        if b.category_id not in seen_cats:
            cat = Category.query.get(b.category_id)
            category_spending.append({
                "category": cat.name if cat else "Other",
                "spent": 0.0,
                "budget": float(b.amount)
            })

    # Savings goals
    goals = SavingsGoal.query.filter_by(user_id=user_id).all()
    goals_data = [g.to_dict() for g in goals]

    generated = RecommendationService.generate_recommendations(
        current_income=float(curr_inc or 0.0),
        current_expenses=float(curr_exp or 0.0),
        category_spending=category_spending,
        previous_month_expenses=float(prev_exp or 0.0),
        savings_goals=goals_data
    )

    # Persist newly generated recommendations without duplicating identical unread ones
    for rec in generated:
        existing = Recommendation.query.filter_by(
            user_id=user_id,
            type=rec["type"],
            title=rec["title"],
            is_read=False
        ).first()

        if not existing:
            new_r = Recommendation(
                user_id=user_id,
                type=rec["type"],
                title=rec["title"],
                message=rec["message"],
                priority=rec["priority"],
                is_read=False
            )
            db.session.add(new_r)

    db.session.commit()

@recommendations_bp.route("", methods=["GET"])
@jwt_required()
def get_recommendations():
    user_id = int(get_jwt_identity())
    generate_user_recommendations(user_id)
    recs = Recommendation.query.filter_by(user_id=user_id).order_by(
        Recommendation.is_read.asc(),
        Recommendation.id.desc()
    ).all()
    return success_response(data=[r.to_dict() for r in recs])

@recommendations_bp.route("/generate", methods=["POST"])
@jwt_required()
def trigger_generation():
    user_id = int(get_jwt_identity())
    generate_user_recommendations(user_id)
    recs = Recommendation.query.filter_by(user_id=user_id).order_by(
        Recommendation.is_read.asc(),
        Recommendation.id.desc()
    ).all()
    return success_response(data=[r.to_dict() for r in recs], message="Recommendations updated")

@recommendations_bp.route("/<int:rec_id>/read", methods=["PUT"])
@jwt_required()
def mark_read(rec_id):
    user_id = int(get_jwt_identity())
    rec = Recommendation.query.filter_by(id=rec_id, user_id=user_id).first()
    if not rec:
        return error_response("Recommendation not found", 404)

    rec.is_read = True
    db.session.commit()
    return success_response(data=rec.to_dict(), message="Marked as read")
