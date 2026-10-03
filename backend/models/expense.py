from datetime import datetime, date
from backend.extensions import db

class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False, default="UPI")
    expense_date = db.Column(db.Date, nullable=False, default=date.today, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else "Other",
            "category_icon": self.category.icon if self.category else "Tag",
            "amount": float(self.amount),
            "description": self.description,
            "payment_method": self.payment_method,
            "expense_date": self.expense_date.isoformat() if self.expense_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
