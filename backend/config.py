import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "pocketsmart-dev-secret-key-2026")
    
    # Support MySQL with fallback to SQLite for local development or testing
    database_url = os.getenv("DATABASE_URL")
    if not database_url or "mysql" not in database_url:
        # Default SQLite path if MySQL is not explicitly reachable or configured
        base_dir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = database_url or f"sqlite:///{os.path.join(base_dir, 'pocketsmart.db')}"
    else:
        SQLALCHEMY_DATABASE_URI = database_url

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "pocketsmart-jwt-secret-key-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-jwt-secret"
