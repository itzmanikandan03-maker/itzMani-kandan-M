import os
from flask import Flask, jsonify
from backend.config import Config
from backend.extensions import db, jwt, cors
from backend.routes import (
    auth_bp,
    dashboard_bp,
    income_bp,
    expenses_bp,
    budgets_bp,
    categories_bp,
    analytics_bp,
    recommendations_bp,
    savings_goals_bp,
    notifications_bp,
    assistant_bp,
)
from backend.routes.categories import seed_default_categories

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(income_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(budgets_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(recommendations_bp)
    app.register_blueprint(savings_goals_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(assistant_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy",
            "service": "PocketSmart AI Backend",
            "version": "1.0.0"
        })

    # Custom JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({
            "success": False,
            "message": "Authorization header missing or invalid"
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({
            "success": False,
            "message": "Token is invalid or expired"
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "success": False,
            "message": "Token has expired. Please log in again."
        }), 401

    with app.app_context():
        try:
            db.create_all()
            seed_default_categories()
        except Exception as e:
            app.logger.warning(f"Database initialization notice: {e}")

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
