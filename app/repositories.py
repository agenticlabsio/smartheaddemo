from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
import uuid

from models import (
    User, FamilyMember, Doctor, Location, Specialty, DoctorSchedule, 
    Appointment, BookingSession, RelationshipTypeEnum, AppointmentStatusEnum, 
    BookingSessionStatusEnum, UserCreate, FamilyMemberCreate, AppointmentCreate,
    UserRead, FamilyMemberRead, AppointmentRead
)

class UserRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def create_user(self, user_data: UserCreate, hashed_password: str) -> User:
        """Create a new user"""
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            date_of_birth=user_data.date_of_birth,
            phone_number=user_data.phone_number,
            address=user_data.address,
            is_active=user_data.is_active
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    def update_user(self, user_id: int, user_data: Dict[str, Any]) -> Optional[User]:
        """Update user details"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        for key, value in user_data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def change_password(self, user_id: int, hashed_password: str) -> bool:
        """Update user password"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        user.hashed_password = hashed_password
        self.db.commit()
        return True
    
    def deactivate_user(self, user_id: int) -> bool:
        """Deactivate a user account"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        user.is_active = False
        self.db.commit()
        return True


class FamilyMemberRepository:
    """Repository for FamilyMember operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_family_member_by_id(self, member_id: int) -> Optional[FamilyMember]:
        """Get family member by ID"""
        return self.db.query(FamilyMember).filter(FamilyMember.id == member_id).first()
    
    def get_family_members_by_user(self, user_id: int) -> List[FamilyMember]:
        """Get all family members for a user"""
        return self.db.query(FamilyMember).filter(FamilyMember.user_id == user_id).all()
    
    def get_authorized_family_members(self, user_id: int) -> List[FamilyMember]:
        """Get all authorized family members for a user"""
        return self.db.query(FamilyMember).filter(
            FamilyMember.user_id == user_id,
            FamilyMember.is_authorized == True
        ).all()
    
    def create_family_member(self, member_data: FamilyMemberCreate) -> FamilyMember:
        """Create a new family member"""
        db_member = FamilyMember(
            user_id=member_data.user_id,
            full_name=member_data.full_name,
            date_of_birth=member_data.date_of_birth,
            relation_type=RelationshipTypeEnum[member_data.relation_type],
            is_authorized=member_data.is_authorized
        )
        
        self.db.add(db_member)
        self.db.commit()
        self.db.refresh(db_member)
        
        return db_member
    
    def update_family_member(self, member_id: int, updates: Dict[str, Any]) -> Optional[FamilyMember]:
        """Update family member information"""
        member = self.get_family_member_by_id(member_id)
        
        if not member:
            return None
        
        # Update fields
        for key, value in updates.items():
            if hasattr(member, key) and value is not None:
                # Convert string relation_type to enum if needed
                if key == "relation_type" and isinstance(value, str):
                    value = RelationshipTypeEnum[value]
                setattr(member, key, value)
        
        self.db.commit()
        self.db.refresh(member)
        
        return member
    
    def delete_family_member(self, member_id: int) -> bool:
        """Delete a family member (soft delete by setting is_authorized to False)"""
        member = self.get_family_member_by_id(member_id)
        
        if not member:
            return False
        
        member.is_authorized = False
        self.db.commit()
        
        return True


class DoctorRepository:
    """Repository for Doctor operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_doctor_by_id(self, doctor_id: int) -> Optional[Doctor]:
        """Get doctor by ID"""
        return self.db.query(Doctor).filter(Doctor.id == doctor_id).first()
    
    def get_doctors(
        self, 
        specialty: Optional[str] = None, 
        location: Optional[str] = None,
        doctor_name: Optional[str] = None
    ) -> List[Doctor]:
        """Get doctors filtered by specialty and/or location"""
        query = self.db.query(Doctor).filter(Doctor.is_active == True)
        
        # Apply filters
        if specialty:
            query = query.filter(Doctor.specialty == specialty)
        
        if location:
            query = query.join(Doctor.location).filter(Location.name == location)
        
        if doctor_name:
            query = query.filter(Doctor.full_name.ilike(f"%{doctor_name}%"))
        
        return query.all()
    
    def get_doctor_availability(self, doctor_id: int, date: datetime) -> List[DoctorSchedule]:
        """Get doctor availability for a specific date"""
        day_of_week = date.weekday()  # 0-6 for Monday-Sunday
        
        return self.db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == day_of_week,
            DoctorSchedule.is_available == True
        ).all()
    
class DoctorScheduleRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_doctor_schedules(self, doctor_id: int):
        """Get all schedules for a doctor"""
        return self.db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.is_available == True
        ).all()


class LocationRepository:
    """Repository for Location operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_location_by_id(self, location_id: int) -> Optional[Location]:
        """Get location by ID"""
        return self.db.query(Location).filter(Location.id == location_id).first()
    
    def get_location_by_name(self, name: str) -> Optional[Location]:
        """Get location by name"""
        return self.db.query(Location).filter(Location.name == name).first()
    
    def get_all_locations(self) -> List[Location]:
        """Get all active locations"""
        return self.db.query(Location).filter(Location.is_active == True).all()


class SpecialtyRepository:
    """Repository for Specialty operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_specialty_by_id(self, specialty_id: int) -> Optional[Specialty]:
        """Get specialty by ID"""
        return self.db.query(Specialty).filter(Specialty.id == specialty_id).first()
    
    def get_specialty_by_name(self, name: str) -> Optional[Specialty]:
        """Get specialty by name"""
        return self.db.query(Specialty).filter(Specialty.name == name).first()
    
    def get_all_specialties(self) -> List[Specialty]:
        """Get all specialties"""
        return self.db.query(Specialty).all()


class AppointmentRepository:
    """Repository for Appointment operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_appointment_by_id(self, appointment_id: int) -> Optional[Appointment]:
        """Get appointment by ID"""
        return self.db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    def get_appointment_by_confirmation_id(self, confirmation_id: str) -> Optional[Appointment]:
        """Get appointment by confirmation ID"""
        return self.db.query(Appointment).filter(Appointment.confirmation_id == confirmation_id).first()
    
    def get_appointments_by_user(self, user_id: int, include_family: bool = True) -> List[Appointment]:
        """Get all appointments for a user and optionally their family members"""
        query = self.db.query(Appointment).filter(Appointment.user_id == user_id)
        
        if not include_family:
            # Only include appointments for the user themselves (not family members)
            query = query.filter(Appointment.family_member_id == None)
        
        return query.order_by(Appointment.date_time.desc()).all()
    
    def get_appointments_by_doctor(
        self, 
        doctor_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Appointment]:
        """Get appointments for a doctor within a date range"""
        query = self.db.query(Appointment).filter(Appointment.doctor_id == doctor_id)
        
        if start_date:
            query = query.filter(Appointment.date_time >= start_date)
        
        if end_date:
            query = query.filter(Appointment.date_time <= end_date)
        
        return query.order_by(Appointment.date_time).all()
    
    def get_upcoming_appointments_by_user(self, user_id: int) -> List[Appointment]:
        """Get upcoming appointments for a user and their family members"""
        now = datetime.now()
        return self.db.query(Appointment).filter(
            Appointment.user_id == user_id,
            Appointment.date_time >= now,
            Appointment.status.in_([AppointmentStatusEnum.REQUESTED, AppointmentStatusEnum.CONFIRMED])
        ).order_by(Appointment.date_time).all()
    
    def create_appointment(self, appointment_data: AppointmentCreate) -> Appointment:
        """Create a new appointment"""
        # Generate confirmation ID if not provided
        if not appointment_data.confirmation_id:
            # Format: BK-XXXXX (random alphanumeric)
            confirmation_id = f"BK-{uuid.uuid4().hex[:5].upper()}"
        else:
            confirmation_id = appointment_data.confirmation_id
        
        # Convert string status to enum if needed
        status = appointment_data.status
        if isinstance(status, str):
            status = AppointmentStatusEnum[status]
        
        db_appointment = Appointment(
            user_id=appointment_data.user_id,
            family_member_id=appointment_data.family_member_id,
            doctor_id=appointment_data.doctor_id,
            location_id=appointment_data.location_id,
            date_time=appointment_data.date_time,
            duration_minutes=appointment_data.duration_minutes,
            reason=appointment_data.reason,
            status=status,
            notes=appointment_data.notes,
            confirmation_id=confirmation_id
        )
        
        self.db.add(db_appointment)
        self.db.commit()
        self.db.refresh(db_appointment)
        
        return db_appointment
    
    def update_appointment(self, appointment_id: int, updates: Dict[str, Any]) -> Optional[Appointment]:
        """Update appointment information"""
        appointment = self.get_appointment_by_id(appointment_id)
        
        if not appointment:
            return None
        
        # Update fields
        for key, value in updates.items():
            if hasattr(appointment, key) and value is not None:
                # Convert string status to enum if needed
                if key == "status" and isinstance(value, str):
                    value = AppointmentStatusEnum[value]
                setattr(appointment, key, value)
        
        self.db.commit()
        self.db.refresh(appointment)
        
        return appointment
    
    def cancel_appointment(self, appointment_id: int, cancel_reason: Optional[str] = None) -> Optional[Appointment]:
        """Cancel an appointment"""
        appointment = self.get_appointment_by_id(appointment_id)
        
        if not appointment:
            return None
        
        appointment.status = AppointmentStatusEnum.CANCELED
        
        if cancel_reason:
            appointment.notes = f"{appointment.notes or ''}\nCancellation reason: {cancel_reason}"
        
        self.db.commit()
        self.db.refresh(appointment)
        
        return appointment
    
    def reschedule_appointment(
        self, 
        appointment_id: int, 
        new_date_time: datetime,
        new_duration_minutes: Optional[int] = None
    ) -> Optional[Appointment]:
        """Reschedule an appointment to a new date/time"""
        appointment = self.get_appointment_by_id(appointment_id)
        
        if not appointment:
            return None
        
        # Update appointment
        appointment.date_time = new_date_time
        appointment.status = AppointmentStatusEnum.RESCHEDULED
        
        if new_duration_minutes:
            appointment.duration_minutes = new_duration_minutes
            
        self.db.commit()
        self.db.refresh(appointment)
        
        return appointment


class BookingSessionRepository:
    """Repository for BookingSession operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_session_by_id(self, session_id: str) -> Optional[BookingSession]:
        """Get booking session by ID"""
        return self.db.query(BookingSession).filter(BookingSession.session_id == session_id).first()
    
    def get_active_session_by_user(self, user_id: int) -> Optional[BookingSession]:
        """Get active booking session for a user"""
        now = datetime.now()
        return self.db.query(BookingSession).filter(
            BookingSession.user_id == user_id,
            BookingSession.expires_at > now,
            BookingSession.status.in_([
                BookingSessionStatusEnum.INITIALIZED, 
                BookingSessionStatusEnum.IN_PROGRESS
            ])
        ).order_by(BookingSession.created_at.desc()).first()
    
    def create_session(self, user_id: int, session_id: str, ttl_minutes: int = 60) -> BookingSession:
        """Create a new booking session"""
        expires_at = datetime.now() + timedelta(minutes=ttl_minutes)
        
        db_session = BookingSession(
            session_id=session_id,
            user_id=user_id,
            status=BookingSessionStatusEnum.INITIALIZED,
            expires_at=expires_at
        )
        
        self.db.add(db_session)
        self.db.commit()
        self.db.refresh(db_session)
        
        return db_session
    
    def update_session(self, session_id: str, updates: Dict[str, Any]) -> Optional[BookingSession]:
        """Update booking session information"""
        session = self.get_session_by_id(session_id)
        
        if not session:
            return None
        
        # Update fields
        for key, value in updates.items():
            if hasattr(session, key):
                # Convert string status to enum if needed
                if key == "status" and isinstance(value, str):
                    value = BookingSessionStatusEnum[value]
                setattr(session, key, value)
        
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def extend_session(self, session_id: str, minutes: int = 30) -> Optional[BookingSession]:
        """Extend the expiration time of a session"""
        session = self.get_session_by_id(session_id)
        
        if not session:
            return None
        
        session.expires_at = datetime.now() + timedelta(minutes=minutes)
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def end_session(self, session_id: str, status: BookingSessionStatusEnum = BookingSessionStatusEnum.COMPLETED) -> Optional[BookingSession]:
        """End a booking session with the specified status"""
        session = self.get_session_by_id(session_id)
        
        if not session:
            return None
        
        session.status = status
        session.expires_at = datetime.now()
        
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def get_session_history_by_user(self, user_id: int, limit: int = 10) -> List[BookingSession]:
        """Get booking session history for a user"""
        return self.db.query(BookingSession).filter(
            BookingSession.user_id == user_id
        ).order_by(BookingSession.created_at.desc()).limit(limit).all()