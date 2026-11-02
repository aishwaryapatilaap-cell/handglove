import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from config import settings
from database import get_db
import models, schemas, ratelimit
from auth_utils import (COOKIE_NAME, DUMMY_HASH, create_access_token, hash_password,
                        verify_password, get_current_user)

router = APIRouter()
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"   # no look-alike characters


def new_link_code(db: Session) -> str:
    while True:
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(6))
        if not db.query(models.User).filter(models.User.link_code == code).first():
            return code


def user_out(user: models.User, db: Session) -> schemas.UserOut:
    out = schemas.UserOut.model_validate(user)
    if user.therapist_id:
        t = db.get(models.User, user.therapist_id)
        out.therapist_name = t.full_name if t else None
    if user.role != models.Role.therapist:
        out.link_code = None
    return out


@router.post("/register", status_code=201)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(400, "An account with this email already exists")
    is_therapist = payload.role == models.Role.therapist
    user = models.User(
        email=email, full_name=payload.full_name, hashed_password=hash_password(payload.password),
        role=payload.role, is_approved=not is_therapist, consent_at=datetime.now(timezone.utc),
        link_code=new_link_code(db) if is_therapist else None,
    )
    db.add(user)
    db.commit()
    return {"ok": True, "pending_approval": is_therapist}


@router.post("/login", response_model=schemas.UserOut)
def login(payload: schemas.LoginRequest, response: Response, db: Session = Depends(get_db)):
    key = payload.email.lower()
    wait = ratelimit.seconds_locked(key)
    if wait:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                            f"Too many failed attempts. Try again in {wait // 60 + 1} minutes.")
    user = db.query(models.User).filter(models.User.email == key).first()
    ok = verify_password(payload.password, user.hashed_password if user else DUMMY_HASH)
    if not user or not ok or not user.is_active:
        ratelimit.record_failure(key)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    if user.role == models.Role.therapist and not user.is_approved:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Your therapist account is waiting for approval.")
    ratelimit.clear(key)
    response.set_cookie(COOKIE_NAME, create_access_token(user.id), httponly=True, samesite="lax",
                        secure=settings.cookie_secure, max_age=settings.access_token_minutes * 60, path="/")
    return user_out(user, db)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_out(user, db)
