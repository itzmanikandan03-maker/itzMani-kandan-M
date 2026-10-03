from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.notification import Notification
from backend.utils.validators import success_response, error_response

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@notifications_bp.route("", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifications = Notification.query.filter_by(user_id=user_id).order_by(
        Notification.is_read.asc(),
        Notification.created_at.desc()
    ).all()
    return success_response(data=[n.to_dict() for n in notifications])

@notifications_bp.route("/<int:notif_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notif_id):
    user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if not notif:
        return error_response("Notification not found", 404)

    notif.is_read = True
    db.session.commit()
    return success_response(data=notif.to_dict(), message="Notification marked as read")
