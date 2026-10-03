import os
from datetime import date, timedelta
from backend.app import create_app
from backend.extensions import db
from backend.models.user import User
from backend.models.category import Category
from backend.models.income import Income
from backend.models.expense import Expense
from backend.models.budget import Budget
from backend.models.savings_goal import SavingsGoal
from backend.models.recommendation import Recommendation
from backend.models.notification import Notification
from backend.routes.categories import seed_default_categories

def seed_demo_data():
    app = create_app()
    with app.app_context():
        print("Ensuring database tables and categories exist...")
        db.create_all()
        seed_default_categories()

        demo_email = "demo@pocketsmart.ai"
        user = User.query.filter_by(email=demo_email).first()

        if user:
            print(f"Cleaning existing demo data for {demo_email}...")
            db.session.delete(user)
            db.session.commit()

        print(f"Creating demo user: {demo_email}")
        user = User(name="Alex Sharma", email=demo_email)
        user.set_password("Demo@123")
        db.session.add(user)
        db.session.commit()

        # Fetch categories
        cats = {c.name: c.id for c in Category.query.all()}
        today = date.today()
        curr_month = today.month
        curr_year = today.year

        # Seed Income
        incomes = [
            Income(
                user_id=user.id,
                amount=75000.0,
                source="Tech Corp Salary",
                date=today.replace(day=1),
                description="Monthly Primary Salary"
            ),
            Income(
                user_id=user.id,
                amount=12000.0,
                source="Freelance Consulting",
                date=today.replace(day=12),
                description="Frontend UI Design project"
            )
        ]
        db.session.add_all(incomes)

        # Seed Budgets
        budgets = [
            Budget(user_id=user.id, category_id=cats.get("Food", 1), amount=8000.0, month=curr_month, year=curr_year),
            Budget(user_id=user.id, category_id=cats.get("Rent", 8), amount=25000.0, month=curr_month, year=curr_year),
            Budget(user_id=user.id, category_id=cats.get("Shopping", 3), amount=5000.0, month=curr_month, year=curr_year),
            Budget(user_id=user.id, category_id=cats.get("Transport", 2), amount=4000.0, month=curr_month, year=curr_year),
            Budget(user_id=user.id, category_id=cats.get("Bills", 5), amount=4500.0, month=curr_month, year=curr_year),
            Budget(user_id=user.id, category_id=cats.get("Entertainment", 4), amount=3500.0, month=curr_month, year=curr_year),
        ]
        db.session.add_all(budgets)

        # Seed Expenses
        expenses = [
            Expense(
                user_id=user.id,
                category_id=cats.get("Rent", 8),
                amount=25000.0,
                description="Monthly Apartment Rent",
                payment_method="Bank Transfer",
                expense_date=today.replace(day=2)
            ),
            Expense(
                user_id=user.id,
                category_id=cats.get("Bills", 5),
                amount=2200.0,
                description="Electricity & Water Utility Bill",
                payment_method="UPI",
                expense_date=today.replace(day=5)
            ),
            Expense(
                user_id=user.id,
                category_id=cats.get("Food", 1),
                amount=3400.0,
                description="Supermarket Groceries & Essentials",
                payment_method="Credit Card",
                expense_date=today.replace(day=6)
            ),
            Expense(
                user_id=user.id,
                category_id=cats.get("Transport", 2),
                amount=1400.0,
                description="Fuel Refill & Metro Card Recharge",
                payment_method="UPI",
                expense_date=today.replace(day=8)
            ),
            Expense(
                user_id=user.id,
                category_id=cats.get("Shopping", 3),
                amount=5600.0, # Exceeds budget 5000!
                description="Amazon Shoes & Noise Cancelling Headphones",
                payment_method="Credit Card",
                expense_date=today.replace(day=14)
            ),
            Expense(
                user_id=user.id,
                category_id=cats.get("Food", 1),
                amount=4100.0, # Puts food to 7500 / 8000 -> 93% warning!
                description="Weekend Dinner with Team",
                payment_method="Debit Card",
                expense_date=today.replace(day=18)
            ),
            Expense(
                user_id=user.id,
                category_id=cats.get("Entertainment", 4),
                amount=1200.0,
                description="IMAX Cinema Movie Tickets",
                payment_method="UPI",
                expense_date=today.replace(day=21)
            ),
        ]
        db.session.add_all(expenses)

        # Seed Savings Goals
        goals = [
            SavingsGoal(
                user_id=user.id,
                name="MacBook Pro M3",
                target_amount=150000.0,
                current_amount=95000.0,
                target_date=date(curr_year, 12, 31),
                description="Upgrade work machine for software engineering"
            ),
            SavingsGoal(
                user_id=user.id,
                name="Emergency Safety Fund",
                target_amount=200000.0,
                current_amount=140000.0,
                target_date=date(curr_year + 1, 6, 30),
                description="6 months of living expenses reserve"
            ),
            SavingsGoal(
                user_id=user.id,
                name="Japan Winter Trip",
                target_amount=120000.0,
                current_amount=40000.0,
                target_date=date(curr_year + 1, 1, 15),
                description="Holiday flights and hotels"
            )
        ]
        db.session.add_all(goals)

        # Seed Notifications
        notifications = [
            Notification(
                user_id=user.id,
                title="Budget Alert: Shopping Exceeded",
                message="Your Shopping expenditure has exceeded your ₹5,000 monthly allocation.",
                type="alert",
                is_read=False
            ),
            Notification(
                user_id=user.id,
                title="Budget Warning: Food",
                message="You have used 93% of your ₹8,000 Food budget.",
                type="warning",
                is_read=False
            )
        ]
        db.session.add_all(notifications)

        db.session.commit()
        print("Demo seed data successfully created!")

if __name__ == "__main__":
    seed_demo_data()
