import pytest
from datetime import date
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db

@pytest.fixture
def auth_client():
    app = create_app(TestConfig)
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            reg_res = client.post("/api/auth/register", json={
                "name": "Rec User",
                "email": "rec@test.com",
                "password": "Password123",
                "confirm_password": "Password123"
            })
            token = reg_res.get_json()["data"]["token"]
            headers = {"Authorization": f"Bearer {token}"}
            yield client, headers
            db.session.remove()
            db.drop_all()

def test_recommendation_generation(auth_client):
    client, headers = auth_client
    today = date.today()

    # Get category ID for Food
    cat_res = client.get("/api/categories")
    categories = cat_res.get_json()["data"]
    food_cat = next(c for c in categories if c["name"] == "Food")

    # Set Food budget to 2000
    client.post("/api/budgets", json={
        "category_id": food_cat["id"],
        "amount": 2000.0,
        "month": today.month,
        "year": today.year
    }, headers=headers)

    # Spend 2500 on Food -> over budget
    client.post("/api/expenses", json={
        "category_id": food_cat["id"],
        "amount": 2500.0,
        "description": "Party food and drinks",
        "expense_date": today.isoformat()
    }, headers=headers)

    # Trigger recommendation generation
    rec_res = client.post("/api/recommendations/generate", headers=headers)
    assert rec_res.status_code == 200
    recs = rec_res.get_json()["data"]
    assert len(recs) > 0

    over_rec = next((r for r in recs if r["type"] == "budget_exceeded"), None)
    assert over_rec is not None
    assert "Food" in over_rec["title"]
    assert over_rec["priority"] == "high"
