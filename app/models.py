"""
Models for HealthConnect API
This file contains both SQLAlchemy database models and Pydantic schema models.
"""
import enum
from enum import Enum
from sqlalchemy.sql import func
from datetime import datetime, date
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from typing import List, Optional, Dict, Any, Union, Literal
from pydantic import BaseModel, Field, EmailStr, validator, ConfigDict
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Table, Text, Enum as SQLAlchemyEnum

Base = declarative_base()

# =============================================================================
# DATABASE MODELS (SQLAlchemy)
# =============================================================================

# Database Enums (for SQLAlchemy)
class RelationshipTypeEnum(enum.Enum):
    SELF = "SELF"
    CHILD = "CHILD"
    SPOUSE = "SPOUSE"
    PARENT = "PARENT"
    SIBLING = "SIBLING"
    OTHER = "OTHER"

class AppointmentStatusEnum(enum.Enum):
    REQUESTED = "REQUESTED"
    CONFIRMED = "CONFIRMED"
    CANCELED = "CANCELED"
    COMPLETED = "COMPLETED"
    RESCHEDULED = "RESCHEDULED"

class BookingSessionStatusEnum(enum.Enum):
    INITIALIZED = "INITIALIZED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ABANDONED = "ABANDONED"


class User(Base):
    """Main user model for ABC Hospital Network users"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(100))
    full_name = Column(String(100))
    date_of_birth = Column(DateTime)
    phone_number = Column(String(20))
    address = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    family_members = relationship("FamilyMember", back_populates="user")
    appointments = relationship("Appointment", back_populates="user")
    booking_sessions = relationship("BookingSession", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.full_name}>"


class FamilyMember(Base):
    """Family members associated with a user who can have appointments booked for them"""
    __tablename__ = "family_members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    full_name = Column(String(100))
    date_of_birth = Column(DateTime)
    relation_type = Column(SQLAlchemyEnum(RelationshipTypeEnum))
    is_authorized = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="family_members")
    appointments = relationship("Appointment", back_populates="family_member")
    
    def __repr__(self):
        return f"<FamilyMember {self.full_name} ({self.relation_type.value})>"


class Doctor(Base):
    """Doctor model representing healthcare providers"""
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100))
    specialty = Column(String(100), index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    location = relationship("Location", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
    available_schedules = relationship("DoctorSchedule", back_populates="doctor")
    
    def __repr__(self):
        return f"<Doctor {self.full_name} ({self.specialty})>"


class Location(Base):
    """Medical facilities/locations where appointments can be scheduled"""
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    address = Column(String(200))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    doctors = relationship("Doctor", back_populates="location")
    appointments = relationship("Appointment", back_populates="location")
    
    def __repr__(self):
        return f"<Location {self.name}>"


class Specialty(Base):
    """Medical specialties available for appointment booking"""
    __tablename__ = "specialties"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    description = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<Specialty {self.name}>"


class DoctorSchedule(Base):
    """Doctor availability schedules"""
    __tablename__ = "doctor_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), index=True)
    day_of_week = Column(Integer)  # 0-6 for Monday-Sunday
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    is_available = Column(Boolean, default=True)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="available_schedules")
    
    def __repr__(self):
        return f"<Schedule for Dr. {self.doctor.full_name} on day {self.day_of_week}>"


class Appointment(Base):
    """Appointment record"""
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    date_time = Column(DateTime, index=True)
    duration_minutes = Column(Integer, default=30)
    reason = Column(Text)
    status = Column(SQLAlchemyEnum(AppointmentStatusEnum), default=AppointmentStatusEnum.REQUESTED)
    notes = Column(Text, nullable=True)
    confirmation_id = Column(String(50), unique=True)  # Human-readable ID like "BK-12345"
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="appointments")
    family_member = relationship("FamilyMember", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    location = relationship("Location", back_populates="appointments")
    
    def __repr__(self):
        patient = self.family_member.full_name if self.family_member else self.user.full_name
        return f"<Appointment {self.confirmation_id} for {patient} on {self.date_time}>"


class BookingSession(Base):
    """Session state for the chat-based booking flow"""
    __tablename__ = "booking_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True)  # Redis session ID
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    is_self_booking = Column(Boolean, nullable=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    patient_name = Column(String(100), nullable=True)
    patient_dob = Column(DateTime, nullable=True)
    reason = Column(Text, nullable=True)
    location_preference = Column(String(100), nullable=True)
    specialty_preference = Column(String(100), nullable=True)
    doctor_preference = Column(String(100), nullable=True)
    selected_slot = Column(DateTime, nullable=True)
    booking_id = Column(String(100), nullable=True)  # Resulting booking ID if successful
    status = Column(SQLAlchemyEnum(BookingSessionStatusEnum), default=BookingSessionStatusEnum.INITIALIZED)
    last_node = Column(String(50), nullable=True)  # Last LangGraph node processed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime)  # When Redis session should expire
    
    # Relationships
    user = relationship("User", back_populates="booking_sessions")
    
    def __repr__(self):
        return f"<BookingSession {self.session_id} for user {self.user_id}>"

# =============================================================================
# PYDANTIC MODELS (API Schemas)
# =============================================================================

# Pydantic Enums (for API schemas)
class RelationshipType(str, Enum):
    SELF = "SELF"
    CHILD = "CHILD"
    SPOUSE = "SPOUSE"
    PARENT = "PARENT"
    SIBLING = "SIBLING"
    OTHER = "OTHER"

class AppointmentStatus(str, Enum):
    """Enum for appointment status"""
    REQUESTED = "REQUESTED"
    CONFIRMED = "CONFIRMED"
    CANCELED = "CANCELED"
    COMPLETED = "COMPLETED"
    RESCHEDULED = "RESCHEDULED"

class BookingSessionStatus(str, Enum):
    """Status for the chat-based booking session"""
    INITIALIZED = "INITIALIZED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ABANDONED = "ABANDONED"


# Base models for common fields
class DateTimeModelMixin(BaseModel):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# User related models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    date_of_birth: date
    phone_number: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True
    
    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserRead(UserBase, DateTimeModelMixin):
    id: int


# Location related models
class LocationBase(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    is_active: bool = True
    
    model_config = ConfigDict(from_attributes=True)


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


class LocationRead(LocationBase):
    id: int


# Specialty related models
class SpecialtyBase(BaseModel):
    name: str
    description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class SpecialtyCreate(SpecialtyBase):
    pass


class SpecialtyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class SpecialtyRead(SpecialtyBase):
    id: int


# Family Member related models
class FamilyMemberBase(BaseModel):
    full_name: str
    date_of_birth: date
    relation_type: str  # Changed from enum to string to avoid schema issues
    is_authorized: bool = True
    
    model_config = ConfigDict(from_attributes=True)


class FamilyMemberCreate(FamilyMemberBase):
    user_id: int


class FamilyMemberUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    relation_type: Optional[str] = None  # Changed from enum to string
    is_authorized: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


class FamilyMemberRead(FamilyMemberBase, DateTimeModelMixin):
    id: int
    user_id: int


# Doctor related models
class DoctorBase(BaseModel):
    full_name: str
    specialty: str
    location_id: int
    is_active: bool = True
    
    model_config = ConfigDict(from_attributes=True)


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    specialty: Optional[str] = None
    location_id: Optional[int] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


class DoctorRead(DoctorBase):
    id: int
    location: Optional["LocationRead"] = None


# Doctor Schedule related models
class DoctorScheduleBase(BaseModel):
    doctor_id: int
    day_of_week: int  # 0-6 for Monday-Sunday
    start_time: datetime
    end_time: datetime
    is_available: bool = True
    
    model_config = ConfigDict(from_attributes=True)


class DoctorScheduleCreate(DoctorScheduleBase):
    pass


class DoctorScheduleUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_available: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


class DoctorScheduleRead(DoctorScheduleBase):
    id: int


# Appointment related models
class AppointmentBase(BaseModel):
    user_id: int
    family_member_id: Optional[int] = None
    doctor_id: int
    location_id: int
    date_time: datetime
    duration_minutes: int = 30
    reason: str
    status: str = "REQUESTED"  # Changed from enum to string to avoid schema issues
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class AppointmentCreate(AppointmentBase):
    confirmation_id: Optional[str] = None


class AppointmentUpdate(BaseModel):
    doctor_id: Optional[int] = None
    location_id: Optional[int] = None
    date_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    reason: Optional[str] = None
    status: Optional[str] = None  # Changed from enum to string
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class AppointmentRead(AppointmentBase, DateTimeModelMixin):
    id: int
    family_member: Optional[FamilyMemberRead] = None
    doctor: Optional[DoctorRead] = None
    location: Optional[LocationRead] = None
    confirmation_id: str


# Models for booking session state management
class BookingSessionBase(BaseModel):
    session_id: str
    user_id: int
    is_self_booking: Optional[bool] = None
    family_member_id: Optional[int] = None
    patient_name: Optional[str] = None
    patient_dob: Optional[date] = None
    reason: Optional[str] = None
    location_preference: Optional[str] = None
    specialty_preference: Optional[str] = None
    doctor_preference: Optional[str] = None
    selected_slot: Optional[datetime] = None
    booking_id: Optional[str] = None
    status: str = "INITIALIZED"  # Changed from enum to string
    last_node: Optional[str] = None
    error_message: Optional[str] = None
    expires_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class BookingSessionCreate(BookingSessionBase):
    pass


class BookingSessionUpdate(BaseModel):
    is_self_booking: Optional[bool] = None
    family_member_id: Optional[int] = None
    patient_name: Optional[str] = None
    patient_dob: Optional[date] = None
    reason: Optional[str] = None
    location_preference: Optional[str] = None
    specialty_preference: Optional[str] = None
    doctor_preference: Optional[str] = None
    selected_slot: Optional[datetime] = None
    booking_id: Optional[str] = None
    status: Optional[str] = None  # Changed from enum to string
    last_node: Optional[str] = None
    error_message: Optional[str] = None
    expires_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class BookingSessionRead(BookingSessionBase, DateTimeModelMixin):
    id: int


# LangGraph State Model - for managing conversation state in LangGraph
class BookingState(BaseModel):
    user_id: str
    session_id: str
    patient_name: Optional[str] = None
    patient_dob: Optional[date] = None
    is_self_booking: Optional[bool] = None
    selected_family_member_id: Optional[str] = None
    reason: Optional[str] = None
    location_preference: Optional[str] = None
    specialty_preference: Optional[str] = None
    doctor_preference: Optional[str] = None
    available_slots_raw: Optional[List[Dict[str, Any]]] = None
    presented_slots_text: Optional[str] = None
    selected_slot: Optional[Dict[str, Any]] = None
    confirmation_details: Optional[Dict[str, Any]] = None
    last_bot_message: Optional[str] = None
    error_message: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class CalSlot(BaseModel):
    """Representation of an available time slot"""
    start: datetime
    end: datetime
    status: str = "available"
    bookingId: Optional[str] = None
    userId: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ChatMessage(BaseModel):
    """Model representing a single message in the chat"""
    role: Literal["user", "assistant"]
    content: str
    
    model_config = ConfigDict(from_attributes=True)


class ChatRequest(BaseModel):
    """User's chat message"""
    message: str
    session_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ChatResponse(BaseModel):
    """Bot's response to a chat message"""
    message: str
    session_id: str
    booking_state: Optional[BookingState] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserContext(BaseModel):
    """User context information used at the start of a chat session"""
    user_id: str
    full_name: str
    date_of_birth: date
    family_members: List[FamilyMemberRead] = []
    
    model_config = ConfigDict(from_attributes=True)


class PatientOption(BaseModel):
    """Option for patient selection in the chat"""
    id: Optional[str] = None
    name: str
    relationship: str  # Using string instead of enum type
    date_of_birth: Optional[date] = None
    
    model_config = ConfigDict(from_attributes=True)


class DoctorAvailabilityRequest(BaseModel):
    """Request parameters for doctor availability"""
    specialty: Optional[str] = None
    location: Optional[str] = None
    doctor_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    model_config = ConfigDict(from_attributes=True)


class DoctorAvailabilityResponse(BaseModel):
    """Response with doctor availability slots"""
    doctor_id: str
    doctor_name: str
    specialty: str
    location: str
    available_slots: List[CalSlot]
    
    model_config = ConfigDict(from_attributes=True)


# Update forward references to handle circular dependencies
DoctorRead.model_rebuild()
AppointmentRead.model_rebuild()