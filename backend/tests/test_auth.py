import json
import pytest
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db

@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

def test_user_registration_success(client):
    res = client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "SecurePassword123",
        "confirm_password": "SecurePassword123"
    })
    data = res.get_json()
    assert res.status_code == 201
    assert data["success"] is True
    assert "token" in data["data"]
    assert data["data"]["user"]["email"] == "jane@example.com"

def test_user_registration_password_mismatch(client):
    res = client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": "jane2@example.com",
        "password": "Password123",
        "confirm_password": "DifferentPassword123"
    })
    data = res.get_json()
    assert res.status_code == 400
    assert data["success"] is False
    assert "Passwords do not match" in data["message"]

def test_user_registration_duplicate_email(client):
    payload = {
        "name": "Jane Doe",
        "email": "dup@example.com",
        "password": "Password123",
        "confirm_password": "Password123"
    }
    client.post("/api/auth/register", json=payload)
    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 409
    assert res2.get_json()["success"] is False

def test_user_login_success(client):
    client.post("/api/auth/register", json={
        "name": "Alex",
        "email": "alex@test.com",
        "password": "Password123",
        "confirm_password": "Password123"
    })
    res = client.post("/api/auth/login", json={
        "email": "alex@test.com",
        "password": "Password123"
    })
    data = res.get_json()
    assert res.status_code == 200
    assert data["success"] is True
    assert "token" in data["data"]

def test_user_login_invalid_password(client):
    client.post("/api/auth/register", json={
        "name": "Alex",
        "email": "alex2@test.com",
        "password": "Password123",
        "confirm_password": "Password123"
    })
    res = client.post("/api/auth/login", json={
        "email": "alex2@test.com",
        "password": "WrongPassword"
    })
    assert res.status_code == 401
    assert res.get_json()["success"] is False
