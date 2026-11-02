from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from config import settings
from database import get_db
import models

ALGORITHM = "HS256"
COOKIE_NAME = "nk_token"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DUMMY_HASH = pwd_context.hash("not-a-real-password-1")   # equalises timing for unknown emails


def hash_password(p: str) -> str:
    return pwd_context.hash(p)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.secret_key, algorithm=ALGORITHM)


def _token_from(request: Request) -> Optional[str]:
    t = request.cookies.get(COOKIE_NAME)
    if t:
        return t
    auth = request.headers.get("authorization", "")
    return auth[7:] if auth.lower().startswith("bearer ") else None


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    err = HTTPException(status.HTTP_401_UNAUTHORIZED, "Not signed in")
    token = _token_from(request)
    if not token:
        raise err
    try:
        user_id = int(jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM]).get("sub"))
    except (JWTError, TypeError, ValueError):
        raise err
    user = db.get(models.User, user_id)
    if user is None or not user.is_active:
        raise err
    if user.role == models.Role.therapist and not user.is_approved:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Therapist account is waiting for approval")
    return user


def require_therapist(user: models.User = Depends(get_current_user)) -> models.User:
    if user.role != models.Role.therapist:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Therapists only")
    return user


def require_patient(user: models.User = Depends(get_current_user)) -> models.User:
    if user.role != models.Role.patient:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Patients only")
    return user


def get_viewable_patient(db: Session, user: models.User, patient_id: int) -> models.User:
    """A patient may view only themselves; a therapist only patients linked to them."""
    if user.role == models.Role.patient:
        if user.id != patient_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")
        return user
    patient = db.get(models.User, patient_id)
    if patient is None or patient.role != models.Role.patient or patient.therapist_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    return patient
