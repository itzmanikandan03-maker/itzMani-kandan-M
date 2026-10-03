import pytest
from datetime import date
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db
from backend.models.category import Category

@pytest.fixture
def auth_client():
    app = create_app(TestConfig)
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            reg_res = client.post("/api/auth/register", json={
                "name": "Budget User",
                "email": "budget@test.com",
                "password": "Password123",
                "confirm_password": "Password123"
            })
            token = reg_res.get_json()["data"]["token"]
            headers = {"Authorization": f"Bearer {token}"}
            yield client, headers
            db.session.remove()
            db.drop_all()

def test_budget_utilization_and_exceeded(auth_client):
    client, headers = auth_client
    today = date.today()

    # 1. Fetch categories
    cat_res = client.get("/api/categories")
    categories = cat_res.get_json()["data"]
    food_cat = next(c for c in categories if c["name"] == "Food")

    # 2. Create budget for Food: ₹3,000
    b_res = client.post("/api/budgets", json={
        "category_id": food_cat["id"],
        "amount": 3000.0,
        "month": today.month,
        "year": today.year
    }, headers=headers)
    assert b_res.status_code == 201

    # 3. Add expense within budget: ₹2,700 (90% utilization -> warning status)
    client.post("/api/expenses", json={
        "category_id": food_cat["id"],
        "amount": 2700.0,
        "description": "Weekly groceries",
        "expense_date": today.isoformat()
    }, headers=headers)

    # 4. Check budget status
    budgets_list = client.get(f"/api/budgets?month={today.month}&year={today.year}", headers=headers).get_json()["data"]
    assert len(budgets_list) == 1
    assert budgets_list[0]["spent"] == 2700.0
    assert budgets_list[0]["utilization_percentage"] == 90.0
    assert budgets_list[0]["status"] == "warning"

    # 5. Add another expense: ₹500 -> total ₹3,200 (> ₹3,000 -> exceeded status)
    client.post("/api/expenses", json={
        "category_id": food_cat["id"],
        "amount": 500.0,
        "description": "Dinner takeout",
        "expense_date": today.isoformat()
    }, headers=headers)

    budgets_list2 = client.get(f"/api/budgets?month={today.month}&year={today.year}", headers=headers).get_json()["data"]
    assert budgets_list2[0]["spent"] == 3200.0
    assert budgets_list2[0]["status"] == "exceeded"

def test_dashboard_calculations(auth_client):
    client, headers = auth_client
    today = date.today()

    # Add income ₹50,000
    client.post("/api/income", json={
        "amount": 50000.0,
        "source": "Salary",
        "date": today.isoformat()
    }, headers=headers)

    # Add expenses ₹15,000
    client.post("/api/expenses", json={
        "amount": 15000.0,
        "description": "Gadget purchase",
        "expense_date": today.isoformat()
    }, headers=headers)

    # Dashboard check
    dash_res = client.get(f"/api/dashboard?month={today.month}&year={today.year}", headers=headers)
    assert dash_res.status_code == 200
    data = dash_res.get_json()["data"]

    summary = data["summary"]
    assert summary["total_income"] == 50000.0
    assert summary["total_expenses"] == 15000.0
    assert summary["remaining_balance"] == 35000.0
    assert summary["savings"] == 35000.0
    assert summary["savings_percentage"] == 70.0
