import re
from datetime import datetime
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from models import Role

Condition = Literal["stroke", "arthritis", "injury", "other"]
Hand = Literal["left", "right", "both"]


def check_password(v: str) -> str:
    if len(v) < 8 or len(v) > 72:
        raise ValueError("Password must be 8 to 72 characters")
    if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
        raise ValueError("Password must contain at least one letter and one number")
    return v


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=80)
    password: str
    role: Role = Role.patient
    consent: bool

    _pw = field_validator("password")(check_password)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        return " ".join(v.split())

    @field_validator("consent")
    @classmethod
    def need_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must agree to the use of your health data to create an account")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: Role
    is_approved: bool
    condition: Optional[str] = None
    affected_hand: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None
    clinical_notes: Optional[str] = None
    prescribed_exercises: Optional[list] = None
    link_code: Optional[str] = None
    therapist_id: Optional[int] = None
    therapist_name: Optional[str] = None
    streak_days: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class PatientOut(BaseModel):
    id: int
    full_name: str
    email: str
    condition: Optional[str] = None
    affected_hand: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None
    clinical_notes: Optional[str] = None
    prescribed_exercises: Optional[list] = None
    streak_days: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    condition: Optional[Condition] = None
    affected_hand: Optional[Hand] = None
    age: Optional[int] = Field(default=None, ge=1, le=120)
    gender: Optional[str] = Field(default=None, max_length=40)
    medical_history: Optional[str] = Field(default=None, max_length=5000)
    medications: Optional[str] = Field(default=None, max_length=2000)
    allergies: Optional[str] = Field(default=None, max_length=2000)
    emergency_contact: Optional[str] = Field(default=None, max_length=120)
    clinical_notes: Optional[str] = Field(default=None, max_length=5000)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    _pw = field_validator("new_password")(check_password)


class DeleteAccount(BaseModel):
    password: str


class LinkRequest(BaseModel):
    code: str = Field(min_length=4, max_length=12)


class SessionCreate(BaseModel):
    level: int = Field(ge=1, le=4)
    exercise_name: str = Field(min_length=1, max_length=120)
    duration_secs: int = Field(ge=0, le=7200)
    score_pct: float = Field(ge=0, le=100)
    reps_completed: Optional[int] = Field(default=None, ge=0, le=500)
    reps_target: Optional[int] = Field(default=None, ge=0, le=500)
    pain_before: Optional[int] = Field(default=None, ge=0, le=10)
    pain_after: Optional[int] = Field(default=None, ge=0, le=10)
    assist_used: bool = False
    finger_angles: Optional[Dict[str, List[float]]] = None
    heart_rate: Optional[float] = Field(default=None, ge=20, le=250)
    spo2: Optional[float] = Field(default=None, ge=50, le=100)

    @field_validator("finger_angles")
    @classmethod
    def limit_angles(cls, v):
        if v is None:
            return v
        if len(v) > 6 or any(len(a) > 1200 for a in v.values()):
            raise ValueError("Too many angle samples")
        return v


class TherapistNote(BaseModel):
    note: str = Field(max_length=2000)


class SessionOut(BaseModel):
    id: int
    patient_id: int
    level: int
    exercise_name: str
    duration_secs: int
    score_pct: float
    xp_earned: int
    reps_completed: Optional[int] = None
    reps_target: Optional[int] = None
    pain_before: Optional[int] = None
    pain_after: Optional[int] = None
    assist_used: bool = False
    finger_angles: Optional[Dict[str, List[float]]] = None
    heart_rate: Optional[float] = None
    spo2: Optional[float] = None
    therapist_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExercisePlan(BaseModel):
    exercises: List[dict] = Field(max_length=30)

class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)

class MessageOut(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    body: str
    read_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True


class LiveStatusIn(BaseModel):
    angles: List[Optional[float]] = Field(min_length=5, max_length=5)
    reps: int = Field(ge=0, le=500)
    motor: str = Field(max_length=20)
    calibrated: bool = False
