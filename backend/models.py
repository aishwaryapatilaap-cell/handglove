from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class Role(str, enum.Enum):
    patient = "patient"
    therapist = "therapist"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.patient, nullable=False)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=True)        # therapists start False until approved
    consent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Patient details
    condition = Column(String, nullable=True)          # stroke | arthritis | injury | other
    affected_hand = Column(String, nullable=True)      # left | right | both
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    medical_history = Column(String, nullable=True)
    medications = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    clinical_notes = Column(String, nullable=True)
    prescribed_exercises = Column(JSON, nullable=True)

    # Therapist: code that patients enter to link to them
    link_code = Column(String, unique=True, index=True, nullable=True)

    # Progress counters
    xp_total = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)
    last_session_date = Column(String, nullable=True)

    # Patient -> their therapist
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    sessions = relationship("ExerciseSession", back_populates="patient", foreign_keys="ExerciseSession.patient_id")


class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    level = Column(Integer, nullable=False)
    exercise_name = Column(String, nullable=False)
    duration_secs = Column(Integer, nullable=False)
    score_pct = Column(Float, nullable=False)
    xp_earned = Column(Integer, default=0)

    reps_completed = Column(Integer, nullable=True)
    reps_target = Column(Integer, nullable=True)
    pain_before = Column(Integer, nullable=True)       # 0-10
    pain_after = Column(Integer, nullable=True)        # 0-10
    assist_used = Column(Boolean, default=False)

    finger_angles = Column(JSON, nullable=True)        # {"index": [..], ...}
    heart_rate = Column(Float, nullable=True)          # optional (sensor removed from current glove)
    spo2 = Column(Float, nullable=True)
    therapist_note = Column(String, nullable=True)

    patient = relationship("User", back_populates="sessions", foreign_keys=[patient_id])


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    body = Column(String(2000), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LiveStatus(Base):
    __tablename__ = "live_status"
    patient_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    angles = Column(JSON, nullable=True)
    reps = Column(Integer, default=0)
    motor = Column(String, default="idle")
    calibrated = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
