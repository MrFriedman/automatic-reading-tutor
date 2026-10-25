from dotenv import load_dotenv
import os
import redis

load_dotenv()

class ApplicationConfig:
    SECRET_KEY = "meow"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_DATABASE_URI = r"sqlite:///./db.sqlite"

    SESSION_TYPE = "redis"
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_REDIS = redis.from_url("redis://127.0.0.1:6379")

    # Optional cross-site cookie settings for a split front-end / API deploy.
    # Leave unset for the local Flask + CRA proxy workflow.
    _samesite = os.environ.get("SESSION_COOKIE_SAMESITE")
    if _samesite:
        SESSION_COOKIE_SAMESITE = _samesite
        SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "true").lower() == "true"