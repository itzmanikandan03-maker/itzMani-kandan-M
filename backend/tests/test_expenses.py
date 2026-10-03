import pytest
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db

@pytest.fixture
def auth_client():
    app = create_app(TestConfig)
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Register user
            reg_res = client.post("/api/auth/register", json={
                "name": "Test User",
                "email": "user@test.com",
                "password": "Password123",
                "confirm_password": "Password123"
            })
            token = reg_res.get_json()["data"]["token"]
            headers = {"Authorization": f"Bearer {token}"}
            yield client, headers
            db.session.remove()
            db.drop_all()

def test_add_and_get_expense(auth_client):
    client, headers = auth_client
    # Add expense
    res = client.post("/api/expenses", json={
        "amount": 450.0,
        "description": "Starbucks Coffee & Croissant",
        "payment_method": "UPI",
        "expense_date": "2026-09-15"
    }, headers=headers)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    exp_id = data["data"]["id"]

    # Get list
    list_res = client.get("/api/expenses", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.get_json()["data"]["expenses"]) == 1

    # Edit expense
    edit_res = client.put(f"/api/expenses/{exp_id}", json={
        "amount": 500.0,
        "description": "Starbucks Coffee & Sandwich"
    }, headers=headers)
    assert edit_res.status_code == 200
    assert edit_res.get_json()["data"]["amount"] == 500.0

    # Delete expense
    del_res = client.delete(f"/api/expenses/{exp_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify deleted
    verify_res = client.get(f"/api/expenses/{exp_id}", headers=headers)
    assert verify_res.status_code == 404
