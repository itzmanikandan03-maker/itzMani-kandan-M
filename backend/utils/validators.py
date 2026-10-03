import re
from datetime import datetime
from flask import jsonify

def success_response(data=None, message=None, code=200):
    payload = {"success": True}
    if data is not None:
        payload["data"] = data
    if message is not None:
        payload["message"] = message
    return jsonify(payload), code

def error_response(message="An error occurred", code=400, details=None):
    payload = {
        "success": False,
        "message": message
    }
    if details:
        payload["details"] = details
    return jsonify(payload), code

def is_valid_email(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email.strip()))

def is_valid_password(password: str) -> tuple[bool, str]:
    if not password or not isinstance(password, str):
        return False, "Password is required"
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, ""

def is_valid_number(value) -> bool:
    try:
        val = float(value)
        return val >= 0
    except (TypeError, ValueError):
        return False

def parse_date(date_str: str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None
