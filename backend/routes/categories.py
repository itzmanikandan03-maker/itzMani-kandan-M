from flask import Blueprint, request
from backend.extensions import db
from backend.models.category import Category
from backend.utils.validators import success_response, error_response

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")

DEFAULT_CATEGORIES = [
    {"name": "Food", "icon": "Utensils"},
    {"name": "Transport", "icon": "Car"},
    {"name": "Shopping", "icon": "ShoppingBag"},
    {"name": "Entertainment", "icon": "Film"},
    {"name": "Bills", "icon": "Receipt"},
    {"name": "Education", "icon": "GraduationCap"},
    {"name": "Healthcare", "icon": "HeartPulse"},
    {"name": "Rent", "icon": "Home"},
    {"name": "Savings", "icon": "PiggyBank"},
    {"name": "Other", "icon": "Tag"},
]

def seed_default_categories():
    for item in DEFAULT_CATEGORIES:
        exists = Category.query.filter_by(name=item["name"]).first()
        if not exists:
            cat = Category(name=item["name"], icon=item["icon"])
            db.session.add(cat)
    db.session.commit()

@categories_bp.route("", methods=["GET"])
def get_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    if not categories:
        seed_default_categories()
        categories = Category.query.order_by(Category.name.asc()).all()
    return success_response(data=[cat.to_dict() for cat in categories])

@categories_bp.route("", methods=["POST"])
def create_category():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    icon = (data.get("icon") or "Tag").strip()

    if not name:
        return error_response("Category name is required", 400)

    existing = Category.query.filter_by(name=name).first()
    if existing:
        return error_response("Category already exists", 409)

    category = Category(name=name, icon=icon)
    db.session.add(category)
    db.session.commit()

    return success_response(data=category.to_dict(), message="Category created", code=201)
