from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import date
from database import get_db
import models, schemas
from auth_utils import get_current_user, require_therapist, require_patient, get_viewable_patient

router = APIRouter()

# ── XP formula ────────────────────────────────────────────────────
def calculate_xp(level: int, score_pct: float, duration_secs: int) -> int:
    """
    Base XP = level * 50
    Score bonus: up to +100 XP at 100% score
    Duration bonus: +1 XP per 10 seconds, capped at +60
    """
    base      = level * 50
    score_xp  = int((score_pct / 100) * 100)
    dur_xp    = min(60, duration_secs // 10)
    return base + score_xp + dur_xp

def level_from_xp(xp: int) -> int:
    """Simple level thresholds: level = floor(xp / 500) + 1, max 10."""
    return min(10, xp // 500 + 1)

def update_streak(user: models.User) -> None:
    today      = str(date.today())
    yesterday  = str(date.fromordinal(date.today().toordinal() - 1))
    if user.last_session_date == today:
        return  # already counted today
    if user.last_session_date == yesterday:
        user.streak_days += 1
    else:
        user.streak_days = 1  # reset streak
    user.last_session_date = today


# ── Endpoints ─────────────────────────────────────────────────────

@router.post("/", response_model=schemas.SessionOut, status_code=201)
def log_session(
    payload:      schemas.SessionCreate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(require_patient),
):
    """Patient logs a completed exercise session. XP and level auto-calculated."""

    xp = calculate_xp(payload.level, payload.score_pct, payload.duration_secs)

    session = models.ExerciseSession(
        patient_id    = current_user.id,
        level         = payload.level,
        exercise_name = payload.exercise_name,
        duration_secs = payload.duration_secs,
        score_pct     = payload.score_pct,
        xp_earned     = xp,
        reps_completed = payload.reps_completed,
        reps_target   = payload.reps_target,
        pain_before   = payload.pain_before,
        pain_after    = payload.pain_after,
        assist_used   = payload.assist_used,
        finger_angles = payload.finger_angles,
        heart_rate    = payload.heart_rate,
        spo2          = payload.spo2,
    )
    db.add(session)

    # Update user XP, level, streak
    current_user.xp_total += xp
    current_user.level     = level_from_xp(current_user.xp_total)
    update_streak(current_user)

    db.commit()
    db.refresh(session)
    return session


@router.get("/my", response_model=List[schemas.SessionOut])
def my_sessions(
    limit:        int         = 20,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Patient: get your own session history (most recent first)."""
    return (
        db.query(models.ExerciseSession)
        .filter(models.ExerciseSession.patient_id == current_user.id)
        .order_by(desc(models.ExerciseSession.created_at))
        .limit(limit)
        .all()
    )


@router.get("/patient/{patient_id}", response_model=List[schemas.SessionOut])
def patient_sessions(
    patient_id:   int,
    limit:        int         = 50,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Therapist OR the patient themselves: view a patient's sessions."""
    get_viewable_patient(db, current_user, patient_id)

    return (
        db.query(models.ExerciseSession)
        .filter(models.ExerciseSession.patient_id == patient_id)
        .order_by(desc(models.ExerciseSession.created_at))
        .limit(limit)
        .all()
    )


@router.patch("/{session_id}/note", response_model=schemas.SessionOut)
def add_therapist_note(
    session_id:   int,
    payload:      schemas.TherapistNote,
    db:           Session     = Depends(get_db),
    therapist:    models.User = Depends(require_therapist),
):
    """Therapist: add a note to a session of one of your linked patients."""
    session = db.query(models.ExerciseSession).filter(
        models.ExerciseSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    get_viewable_patient(db, therapist, session.patient_id)

    session.therapist_note = payload.note
    db.commit()
    db.refresh(session)
    return session


@router.get("/stats/{patient_id}")
def patient_stats(
    patient_id:   int,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Summary stats for a patient: total sessions, avg score, total XP, best streak."""
    patient = get_viewable_patient(db, current_user, patient_id)

    sessions = db.query(models.ExerciseSession).filter(
        models.ExerciseSession.patient_id == patient_id
    ).all()

    avg_score = (
        sum(s.score_pct for s in sessions) / len(sessions) if sessions else 0
    )

    return {
        "patient_id":     patient_id,
        "full_name":      patient.full_name,
        "xp_total":       patient.xp_total,
        "level":          patient.level,
        "streak_days":    patient.streak_days,
        "total_sessions": len(sessions),
        "avg_score_pct":  round(avg_score, 1),
        "total_xp_from_sessions": sum(s.xp_earned for s in sessions),
    }


@router.post("/live")
def update_live_status(payload: schemas.LiveStatusIn, db: Session = Depends(get_db),
                       patient: models.User = Depends(require_patient)):
    status = db.get(models.LiveStatus, patient.id)
    if status is None:
        status = models.LiveStatus(patient_id=patient.id)
        db.add(status)
    status.angles = payload.angles
    status.reps = payload.reps
    status.motor = payload.motor
    status.calibrated = payload.calibrated
    db.commit()
    db.refresh(status)
    return {"ok": True, "updated_at": status.updated_at}


@router.get("/live/{patient_id}")
def read_live_status(patient_id: int, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    patient = get_viewable_patient(db, current_user, patient_id)
    status = db.get(models.LiveStatus, patient.id)
    if status is None:
        return {"connected": False, "angles": [None, None, None, None, None], "reps": 0,
                "motor": "idle", "calibrated": False, "updated_at": None}
    updated = status.updated_at
    if updated is not None and updated.tzinfo is None:
        from datetime import timezone
        updated = updated.replace(tzinfo=timezone.utc)
    from datetime import datetime, timezone, timedelta
    fresh = bool(updated and datetime.now(timezone.utc) - updated < timedelta(seconds=8))
    return {"connected": fresh, "angles": status.angles, "reps": status.reps, "motor": status.motor,
            "calibrated": status.calibrated, "updated_at": status.updated_at}
