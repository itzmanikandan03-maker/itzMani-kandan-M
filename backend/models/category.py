from datetime import datetime
from backend.extensions import db

class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    icon = db.Column(db.String(50), nullable=True, default="Tag")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    expenses = db.relationship("Expense", backref="category", lazy=True)
    budgets = db.relationship("Budget", backref="category", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
