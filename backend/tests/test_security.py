import pytest
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db

@pytest.fixture
def dual_clients():
    app = create_app(TestConfig)
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Register User 1
            res1 = client.post("/api/auth/register", json={
                "name": "User One",
                "email": "user1@test.com",
                "password": "Password123",
                "confirm_password": "Password123"
            })
            token1 = res1.get_json()["data"]["token"]
            headers1 = {"Authorization": f"Bearer {token1}"}

            # Register User 2
            res2 = client.post("/api/auth/register", json={
                "name": "User Two",
                "email": "user2@test.com",
                "password": "Password123",
                "confirm_password": "Password123"
            })
            token2 = res2.get_json()["data"]["token"]
            headers2 = {"Authorization": f"Bearer {token2}"}

            yield client, headers1, headers2
            db.session.remove()
            db.drop_all()

def test_unauthorized_endpoints_rejected(dual_clients):
    client, _, _ = dual_clients
    # No auth header
    res1 = client.get("/api/dashboard")
    assert res1.status_code == 401

    res2 = client.get("/api/expenses")
    assert res2.status_code == 401

    res3 = client.get("/api/income")
    assert res3.status_code == 401

def test_user_ownership_isolation(dual_clients):
    client, headers1, headers2 = dual_clients

    # User 1 creates an expense
    create_res = client.post("/api/expenses", json={
        "amount": 1000.0,
        "description": "User1 Private Item",
        "expense_date": "2026-09-20"
    }, headers=headers1)
    exp_id = create_res.get_json()["data"]["id"]

    # User 2 tries to GET User 1's expense directly -> should be 404
    res_get = client.get(f"/api/expenses/{exp_id}", headers=headers2)
    assert res_get.status_code == 404

    # User 2 tries to DELETE User 1's expense -> should be 404
    res_del = client.delete(f"/api/expenses/{exp_id}", headers=headers2)
    assert res_del.status_code == 404

    # User 2's expense list should be empty
    list_res = client.get("/api/expenses", headers=headers2)
    assert len(list_res.get_json()["data"]["expenses"]) == 0
