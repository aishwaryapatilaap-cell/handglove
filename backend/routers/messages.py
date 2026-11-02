from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, and_, desc
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth_utils import get_current_user, get_viewable_patient

router = APIRouter()

def linked_peer(db, user):
    if user.role == models.Role.patient:
        if not user.therapist_id:
            raise HTTPException(400, "Link a therapist before messaging")
        return user.therapist_id
    patients = db.query(models.User).filter(models.User.therapist_id == user.id).all()
    return [p.id for p in patients]

@router.get("/{peer_id}", response_model=List[schemas.MessageOut])
def conversation(peer_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == models.Role.patient:
        if user.therapist_id != peer_id: raise HTTPException(403, "Not linked to this therapist")
    else:
        get_viewable_patient(db, user, peer_id)
    rows = db.query(models.Message).filter(or_(
        and_(models.Message.sender_id == user.id, models.Message.recipient_id == peer_id),
        and_(models.Message.sender_id == peer_id, models.Message.recipient_id == user.id)
    )).order_by(models.Message.created_at.asc()).limit(200).all()
    for m in rows:
        if m.recipient_id == user.id and m.read_at is None: m.read_at = datetime.now(timezone.utc)
    db.commit()
    return rows

@router.post("/{peer_id}", response_model=schemas.MessageOut, status_code=201)
def send_message(peer_id: int, payload: schemas.MessageCreate,
                 user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == models.Role.patient:
        if user.therapist_id != peer_id: raise HTTPException(403, "Not linked to this therapist")
    else:
        get_viewable_patient(db, user, peer_id)
    msg = models.Message(sender_id=user.id, recipient_id=peer_id, body=payload.body.strip())
    db.add(msg); db.commit(); db.refresh(msg)
    return msg
