from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.utils.validators import (
    success_response,
    error_response,
    is_valid_email,
    is_valid_password,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or data.get("confirmPassword") or ""

    if not name:
        return error_response("Name is required", 400)

    if not is_valid_email(email):
        return error_response("A valid email address is required", 400)

    valid_pw, pw_msg = is_valid_password(password)
    if not valid_pw:
        return error_response(pw_msg, 400)

    if password != confirm_password:
        return error_response("Passwords do not match", 400)

    # Check email uniqueness
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return error_response("An account with this email already exists", 409)

    user = User(name=name, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))

    return success_response(
        data={
            "token": token,
            "user": user.to_dict(),
        },
        message="Registration successful",
        code=201
    )

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return error_response("Email and password are required", 400)

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return error_response("Invalid email or password", 401)

    token = create_access_token(identity=str(user.id))

    return success_response(
        data={
            "token": token,
            "user": user.to_dict(),
        },
        message="Login successful"
    )

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)

    return success_response(data={"user": user.to_dict()})

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    # Client will clear stored JWT token
    return success_response(message="Logged out successfully")
