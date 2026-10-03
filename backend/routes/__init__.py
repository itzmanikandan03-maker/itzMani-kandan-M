from backend.routes.auth import auth_bp
from backend.routes.dashboard import dashboard_bp
from backend.routes.income import income_bp
from backend.routes.expenses import expenses_bp
from backend.routes.budgets import budgets_bp
from backend.routes.categories import categories_bp
from backend.routes.analytics import analytics_bp
from backend.routes.recommendations import recommendations_bp
from backend.routes.savings_goals import savings_goals_bp
from backend.routes.notifications import notifications_bp
from backend.routes.assistant import assistant_bp

__all__ = [
    "auth_bp",
    "dashboard_bp",
    "income_bp",
    "expenses_bp",
    "budgets_bp",
    "categories_bp",
    "analytics_bp",
    "recommendations_bp",
    "savings_goals_bp",
    "notifications_bp",
    "assistant_bp",
]
