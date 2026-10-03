import calendar
from datetime import date
from typing import Dict, Any, Optional

class PredictionService:
    """
    Deterministic Spending Prediction Service.
    Calculates run-rate daily averages and projects total month-end expenditure.
    """

    @staticmethod
    def calculate_month_prediction(
        current_expenses: float,
        current_date: Optional[date] = None,
        monthly_budget: float = 0.0,
        historical_monthly_avg: Optional[float] = None
    ) -> Dict[str, Any]:
        ref_date = current_date or date.today()
        day_of_month = ref_date.day
        year = ref_date.year
        month = ref_date.month

        _, days_in_month = calendar.monthrange(year, month)
        days_elapsed = max(day_of_month, 1)
        days_remaining = max(days_in_month - days_elapsed, 0)

        # Handle empty or zero expenses
        if current_expenses <= 0:
            predicted_expense = 0.0
            daily_avg = 0.0
        elif days_elapsed < 3 and historical_monthly_avg and historical_monthly_avg > 0:
            # First 2 days: damp volatile spikes using historical data if available
            daily_avg = current_expenses / days_elapsed
            predicted_expense = round((daily_avg * 0.4) * days_in_month + (historical_monthly_avg * 0.6), 2)
        else:
            daily_avg = current_expenses / days_elapsed
            predicted_expense = round(daily_avg * days_in_month, 2)

        # Budget comparison
        budget_diff = 0.0
        is_over_budget_projected = False
        projected_overspend = 0.0
        budget_utilization_projected = 0.0

        if monthly_budget > 0:
            budget_diff = round(monthly_budget - predicted_expense, 2)
            budget_utilization_projected = round((predicted_expense / monthly_budget) * 100, 1)
            if predicted_expense > monthly_budget:
                is_over_budget_projected = True
                projected_overspend = round(predicted_expense - monthly_budget, 2)

        return {
            "days_elapsed": days_elapsed,
            "days_in_month": days_in_month,
            "days_remaining": days_remaining,
            "current_expenses": round(current_expenses, 2),
            "daily_average": round(daily_avg, 2),
            "predicted_monthly_expense": round(predicted_expense, 2),
            "monthly_budget": round(monthly_budget, 2),
            "budget_difference": budget_diff,
            "is_over_budget_projected": is_over_budget_projected,
            "projected_overspend": projected_overspend,
            "budget_utilization_projected": budget_utilization_projected,
            "confidence": "high" if days_elapsed >= 7 else ("medium" if days_elapsed >= 3 else "early_month_estimate")
        }
