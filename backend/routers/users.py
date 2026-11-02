from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import desc
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, ratelimit
from auth_utils import (COOKIE_NAME, get_current_user, require_therapist, require_patient,
                        get_viewable_patient, verify_password, hash_password)
from routers.auth import user_out

router = APIRouter()


@router.patch("/me", response_model=schemas.UserOut)
def update_me(payload: schemas.ProfileUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, " ".join(value.split()) if field == "full_name" else value)
    db.commit()
    return user_out(user, db)


@router.post("/me/password")
def change_password(payload: schemas.PasswordChange, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}


@router.post("/me/link-therapist", response_model=schemas.UserOut)
def link_therapist(payload: schemas.LinkRequest, user: models.User = Depends(require_patient), db: Session = Depends(get_db)):
    key = f"link:{user.id}"
    wait = ratelimit.seconds_locked(key)
    if wait:
        raise HTTPException(429, "Too many attempts. Try again in a few minutes.")
    therapist = db.query(models.User).filter(
        models.User.link_code == payload.code.strip().upper(),
        models.User.role == models.Role.therapist, models.User.is_approved == True).first()  # noqa: E712
    if not therapist:
        ratelimit.record_failure(key)
        raise HTTPException(404, "That code was not recognised")
    user.therapist_id = therapist.id
    db.commit()
    return user_out(user, db)


@router.delete("/me/therapist", response_model=schemas.UserOut)
def unlink_therapist(user: models.User = Depends(require_patient), db: Session = Depends(get_db)):
    user.therapist_id = None
    db.commit()
    return user_out(user, db)


@router.get("/me/export")
def export_my_data(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(models.ExerciseSession).filter(models.ExerciseSession.patient_id == user.id).all()
    return {"profile": user_out(user, db).model_dump(mode="json"),
            "sessions": [schemas.SessionOut.model_validate(s).model_dump(mode="json") for s in sessions]}


@router.delete("/me")
def delete_me(payload: schemas.DeleteAccount, response: Response, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(400, "Password is incorrect")
    db.query(models.ExerciseSession).filter(models.ExerciseSession.patient_id == user.id).delete()
    db.query(models.User).filter(models.User.therapist_id == user.id).update({"therapist_id": None})
    db.delete(user)
    db.commit()
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/patients", response_model=List[schemas.PatientOut])
def my_patients(user: models.User = Depends(require_therapist), db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.therapist_id == user.id).all()


@router.get("/patients/summary")
def patients_summary(user: models.User = Depends(require_therapist), db: Session = Depends(get_db)):
    """One row per linked patient with simple attention flags."""
    now = datetime.now(timezone.utc)
    rows = []
    for p in db.query(models.User).filter(models.User.therapist_id == user.id).all():
        ss = (db.query(models.ExerciseSession).filter(models.ExerciseSession.patient_id == p.id)
              .order_by(desc(models.ExerciseSession.created_at)).all())
        last = ss[0].created_at if ss else None
        if last is not None and last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        week = [s for s in ss if s.created_at.replace(tzinfo=s.created_at.tzinfo or timezone.utc) > now - timedelta(days=7)]
        pains = [s.pain_after for s in ss if s.pain_after is not None]
        flags = []
        if last is None or (now - last).days >= 3:
            flags.append("missed_sessions")
        if len(pains) >= 6 and sum(pains[:3]) / 3 - sum(pains[3:6]) / 3 >= 2:
            flags.append("pain_rising")
        rows.append({"id": p.id, "full_name": p.full_name, "condition": p.condition,
                     "affected_hand": p.affected_hand, "last_session_at": last.isoformat() if last else None,
                     "sessions_7d": len(week), "streak_days": p.streak_days, "flags": flags})
    return rows


@router.get("/{user_id}", response_model=schemas.PatientOut)
def get_patient(user_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_viewable_patient(db, user, user_id)


@router.get("/patients/{patient_id}/plan")
def patient_plan(patient_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = get_viewable_patient(db, user, patient_id)
    return {"patient_id": patient.id, "exercises": patient.prescribed_exercises or []}


@router.put("/patients/{patient_id}/plan")
def update_patient_plan(patient_id: int, payload: schemas.ExercisePlan,
                        therapist: models.User = Depends(require_therapist), db: Session = Depends(get_db)):
    patient = get_viewable_patient(db, therapist, patient_id)
    # Plans are therapist-authored; they are not a substitute for an in-person clinical assessment.
    patient.prescribed_exercises = payload.exercises
    db.commit()
    return {"ok": True, "exercises": patient.prescribed_exercises}


@router.patch("/patients/{patient_id}/profile", response_model=schemas.PatientOut)
def update_patient_profile(
    patient_id: int,
    payload: schemas.ProfileUpdate,
    therapist: models.User = Depends(require_therapist),
    db: Session = Depends(get_db),
):
    """Therapist updates the clinical profile of a patient linked to them."""
    patient = get_viewable_patient(db, therapist, patient_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "full_name" and value is not None:
            value = " ".join(value.split())
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient
