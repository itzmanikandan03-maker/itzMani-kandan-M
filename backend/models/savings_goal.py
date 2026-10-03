from datetime import datetime, date
from backend.extensions import db

class SavingsGoal(db.Model):
    __tablename__ = "savings_goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Numeric(12, 2), nullable=False)
    current_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0.0)
    target_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        target = float(self.target_amount)
        current = float(self.current_amount)
        progress = (current / target * 100) if target > 0 else 0
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "target_amount": target,
            "current_amount": current,
            "progress_percentage": round(min(progress, 100.0), 1),
            "target_date": self.target_date.isoformat() if self.target_date else None,
            "description": self.description or "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
