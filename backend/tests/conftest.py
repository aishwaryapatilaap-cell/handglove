import os, sys
os.environ["DATABASE_URL"] = "sqlite:///./test_nk.db"
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import pytest
from fastapi.testclient import TestClient
from database import Base, engine, SessionLocal
import ratelimit, models
from main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    ratelimit.reset()
    return TestClient(app)


def register(c, email, role="patient", pw="Strong123", consent=True):
    return c.post("/api/auth/register", json={"email": email, "full_name": "Test User", "password": pw, "role": role, "consent": consent})


def login(c, email, pw="Strong123"):
    return c.post("/api/auth/login", json={"email": email, "password": pw})


def approve(email):
    db = SessionLocal()
    u = db.query(models.User).filter(models.User.email == email).first()
    u.is_approved = True
    db.commit()
    code = u.link_code
    db.close()
    return code
