from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta, date
import uuid
import json
import os
from dotenv import load_dotenv

from models import (
    UserRead, FamilyMemberRead, PatientOption, DoctorAvailabilityRequest, 
    DoctorAvailabilityResponse, BookingState, ChatRequest, ChatResponse,
    BookingSessionStatus, CalSlot, AppointmentCreate, AppointmentRead,
    UserContext, AppointmentStatus
)
from redis_client import BookingStateRedisClient
from database import get_db
from repositories import (
    UserRepository, FamilyMemberRepository, DoctorRepository,
    LocationRepository, SpecialtyRepository, AppointmentRepository,
    BookingSessionRepository, DoctorScheduleRepository
)
from utils.langchain_integration import get_booking_agent

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="HealthConnect API",
    description="API for HealthConnect appointment booking system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis client
redis_client = BookingStateRedisClient(
    redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    ttl_seconds=int(os.getenv("SESSION_TTL_SECONDS", "3600"))
)

# --------------- Session Management Routes ---------------

@app.post("/api/session")
async def create_session(user_id: str = Body(...)):
    """Create a new booking session"""
    session_id = str(uuid.uuid4())
    
    # Create new booking state in Redis
    booking_state = redis_client.create_new_booking_session(user_id, session_id)
    
    # Create a database record for the session
    db = next(get_db())
    repo = BookingSessionRepository(db)
    session_record = repo.create_session(user_id, session_id)
    
    return {"session_id": session_id, "user_id": user_id}

@app.get("/api/session/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get session information"""
    repo = BookingSessionRepository(db)
    session = repo.get_session_by_id(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get booking state from Redis
    booking_state = redis_client.get_booking_state(session.user_id)
    
    if not booking_state:
        raise HTTPException(status_code=404, detail="Session state not found in Redis")
    
    return {
        "session_id": session_id,
        "user_id": session.user_id,
        "status": session.status,
        "booking_state": booking_state.model_dump()
    }

@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Delete a session"""
    repo = BookingSessionRepository(db)
    session = repo.get_session_by_id(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Delete from Redis
    redis_client.delete_session(session.user_id)
    
    # Update session status in database
    repo.update_session(session_id, {"status": BookingSessionStatus.ABANDONED})
    
    return {"message": "Session deleted successfully"}

@app.get("/api/session-status/{session_id}")
async def check_session_status(session_id: str, db: Session = Depends(get_db)):
    """Check if a session is valid and not expired"""
    repo = BookingSessionRepository(db)
    session = repo.get_session_by_id(session_id)
    
    if not session:
        return {"valid": False, "message": "Session not found"}
    
    # Check if session is expired
    if session.expires_at < datetime.now():
        return {"valid": False, "message": "Session expired"}
    
    # Check if session state exists in Redis
    ttl = redis_client.get_session_ttl(session.user_id)
    redis_valid = ttl is not None and ttl > 0
    
    return {
        "valid": redis_valid, 
        "ttl_seconds": ttl if redis_valid else 0,
        "status": session.status
    }

# --------------- User Context Routes ---------------

@app.get("/api/user-context/{user_id}", response_model=UserContext)
async def get_user_context(user_id: str, db: Session = Depends(get_db)):
    """Get user context including family members for patient selection"""
    user_repo = UserRepository(db)
    family_repo = FamilyMemberRepository(db)
    
    user = user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get authorized family members
    family_members = family_repo.get_authorized_family_members(user_id)
    
    return UserContext(
        user_id=str(user.id),
        full_name=user.full_name,
        date_of_birth=user.date_of_birth,
        family_members=family_members
    )

# --------------- Patient Selection Routes ---------------

@app.get("/api/patient-options/{user_id}", response_model=List[PatientOption])
async def get_patient_options(user_id: str, db: Session = Depends(get_db)):
    """Get patient selection options for the user (self + family members)"""
    user_repo = UserRepository(db)
    family_repo = FamilyMemberRepository(db)
    
    user = user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create "self" option
    options = [
        PatientOption(
            id=str(user.id),
            name=user.full_name,
            relationship="SELF",  # Using plain string instead of enum
            date_of_birth=user.date_of_birth
        )
    ]
    
    # Add authorized family members
    family_members = family_repo.get_authorized_family_members(user_id)
    for member in family_members:
        options.append(
            PatientOption(
                id=str(member.id),
                name=member.full_name,
                relationship=member.relation_type.value,  # Access the value of the enum
                date_of_birth=member.date_of_birth
            )
        )
    
    return options

@app.post("/api/select-patient/{session_id}")
async def select_patient(
    session_id: str, 
    is_self: bool = Body(...),
    family_member_id: Optional[str] = Body(None),
    db: Session = Depends(get_db)
):
    """Select patient for appointment booking"""
    # Get session
    session_repo = BookingSessionRepository(db)
    session = session_repo.get_session_by_id(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get user info
    user_repo = UserRepository(db)
    user = user_repo.get_user_by_id(session.user_id)
    
    # Prepare updates
    updates = {
        "is_self_booking": is_self,
        "patient_name": user.full_name if is_self else None,
        "patient_dob": user.date_of_birth if is_self else None,
    }
    
    # If booking for family member, get their info
    if not is_self and family_member_id:
        family_repo = FamilyMemberRepository(db)
        family_member = family_repo.get_family_member_by_id(family_member_id)
        
        if not family_member or family_member.user_id != int(session.user_id):
            raise HTTPException(status_code=404, detail="Family member not found or not authorized")
        
        updates.update({
            "family_member_id": family_member_id,
            "patient_name": family_member.full_name,
            "patient_dob": family_member.date_of_birth
        })
    
    # Update Redis state
    booking_state = redis_client.update_booking_state(session.user_id, updates)
    if not booking_state:
        raise HTTPException(status_code=500, detail="Failed to update booking state")
    
    # Update database session
    session_repo.update_session(session_id, updates)
    
    return {
        "session_id": session_id,
        "is_self_booking": is_self,
        "patient_name": updates["patient_name"],
        "patient_dob": updates["patient_dob"].isoformat() if updates["patient_dob"] else None,
    }

# --------------- Appointment Logic Routes ---------------

@app.get("/api/specialties", response_model=List[Dict[str, str]])
async def get_specialties(db: Session = Depends(get_db)):
    """Get all available medical specialties"""
    repo = SpecialtyRepository(db)
    specialties = repo.get_all_specialties()
    
    return [{"id": str(s.id), "name": s.name, "description": s.description or ""} for s in specialties]

@app.get("/api/locations", response_model=List[Dict[str, str]])
async def get_locations(db: Session = Depends(get_db)):
    """Get all available locations"""
    repo = LocationRepository(db)
    locations = repo.get_all_locations()
    
    return [{"id": str(l.id), "name": l.name, "address": l.address} for l in locations]

@app.get("/api/doctors", response_model=List[Dict[str, Any]])
async def get_doctors(
    specialty: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get doctors filtered by specialty and/or location"""
    repo = DoctorRepository(db)
    doctors = repo.get_doctors(specialty=specialty, location=location)
    
    return [
        {
            "id": str(d.id),
            "name": d.full_name,
            "specialty": d.specialty,
            "location": d.location.name if d.location else None
        }
        for d in doctors
    ]

@app.post("/api/doctor-availability", response_model=List[DoctorAvailabilityResponse])
async def get_doctor_availability(
    request: DoctorAvailabilityRequest,
    db: Session = Depends(get_db)
):
    """Get doctor availability based on filters"""
    # Set default date range if not provided
    if not request.start_date:
        request.start_date = date.today()
    if not request.end_date:
        request.end_date = date.today() + timedelta(days=14)
    
    # Get doctors matching the criteria
    doctor_repo = DoctorRepository(db)
    doctors = doctor_repo.get_doctors(
        specialty=request.specialty,
        location=request.location,
        doctor_name=request.doctor_name
    )
    
    if not doctors:
        return []
    
    results = []
    schedule_repo = DoctorScheduleRepository(db)
    appt_repo = AppointmentRepository(db)
    
    # For each doctor, get availability from their schedule
    for doctor in doctors:
        # Get doctor's schedule
        doctor_schedules = schedule_repo.get_doctor_schedules(doctor.id)
        
        # Get already booked appointments
        existing_appointments = appt_repo.get_appointments_by_doctor_in_range(
            doctor_id=doctor.id,
            start_date=request.start_date,
            end_date=request.end_date,
            status_filter=[AppointmentStatus.CONFIRMED, AppointmentStatus.REQUESTED]
        )
        
        # Generate available slots
        available_slots = []
        current_date = request.start_date
        
        while current_date <= request.end_date:
            day_of_week = current_date.weekday()  # 0-6 for Monday-Sunday
            
            # Find schedule for this day
            day_schedules = [s for s in doctor_schedules if s.day_of_week == day_of_week and s.is_available]
            
            for schedule in day_schedules:
                # Get the start and end times for this date
                schedule_start = datetime.combine(current_date, schedule.start_time.time())
                schedule_end = datetime.combine(current_date, schedule.end_time.time())
                
                # Generate 30-minute slots
                current_slot_start = schedule_start
                while current_slot_start + timedelta(minutes=30) <= schedule_end:
                    slot_end = current_slot_start + timedelta(minutes=30)
                    
                    # Check if slot overlaps with any existing appointment
                    is_available = True
                    for appt in existing_appointments:
                        appt_end = appt.date_time + timedelta(minutes=appt.duration_minutes)
                        if (current_slot_start < appt_end and slot_end > appt.date_time):
                            is_available = False
                            break
                    
                    if is_available:
                        available_slots.append(
                            CalSlot(
                                start=current_slot_start,
                                end=slot_end
                            )
                        )
                    
                    current_slot_start = slot_end
            
            current_date += timedelta(days=1)
        
        # If no slots available, skip this doctor
        if not available_slots:
            continue
        
        # Add to results
        results.append(
            DoctorAvailabilityResponse(
                doctor_id=str(doctor.id),
                doctor_name=doctor.full_name,
                specialty=doctor.specialty,
                location=doctor.location.name if doctor.location else "",
                available_slots=available_slots
            )
        )
    
    return results

@app.post("/api/book-appointment", response_model=AppointmentRead)
async def book_appointment(
    session_id: str = Body(...),
    reason: str = Body(...),
    doctor_id: str = Body(...),
    slot_start: str = Body(...),  # ISO format
    slot_end: str = Body(...),    # ISO format
    notes: Optional[str] = Body(None),
    db: Session = Depends(get_db)
):
    """Book an appointment using selected doctor and time slot"""
    # Get session
    session_repo = BookingSessionRepository(db)
    session = session_repo.get_session_by_id(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get booking state from Redis
    booking_state = redis_client.get_booking_state(session.user_id)
    if not booking_state:
        raise HTTPException(status_code=404, detail="Session state not found")
    
    # Get doctor details
    doctor_repo = DoctorRepository(db)
    doctor = doctor_repo.get_doctor_by_id(doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Get user
    user_repo = UserRepository(db)
    user = user_repo.get_user_by_id(session.user_id)
    
    # Parse slot times
    start_time = datetime.fromisoformat(slot_start)
    end_time = datetime.fromisoformat(slot_end)
    
    # Check if slot is still available
    appt_repo = AppointmentRepository(db)
    conflicting_appointments = appt_repo.check_appointment_conflicts(
        doctor_id=int(doctor_id),
        date_time=start_time,
        duration_minutes=int((end_time - start_time).total_seconds() / 60)
    )
    
    if conflicting_appointments:
        raise HTTPException(status_code=409, detail="This time slot is no longer available")
    
    # Generate a confirmation ID
    confirmation_id = f"BK-{uuid.uuid4().hex[:8].upper()}"
    
    # Create appointment in our database
    appt_repo = AppointmentRepository(db)
    
    appointment_data = AppointmentCreate(
        user_id=int(session.user_id),
        family_member_id=int(session.family_member_id) if session.family_member_id else None,
        doctor_id=int(doctor_id),
        location_id=doctor.location_id,
        date_time=start_time,
        duration_minutes=int((end_time - start_time).total_seconds() / 60),
        reason=reason,
        notes=notes,
        confirmation_id=confirmation_id,
        status=AppointmentStatus.CONFIRMED
    )
    
    appointment = appt_repo.create_appointment(appointment_data)
    
    # Update booking session
    session_repo.update_session(
        session_id, 
        {
            "status": BookingSessionStatus.COMPLETED,
            "booking_id": appointment.confirmation_id
        }
    )
    
    # Update Redis state
    redis_client.update_booking_state(
        session.user_id,
        {
            "selected_slot": {
                "start": slot_start,
                "end": slot_end
            },
            "confirmation_details": {
                "confirmation_id": appointment.confirmation_id,
                "doctor_name": doctor.full_name,
                "date_time": slot_start,
                "location": doctor.location.name if doctor.location else "",
                "patient_name": booking_state.patient_name or user.full_name
            }
        }
    )
    
    return appointment

# --------------- LangChain Integration Routes ---------------

@app.post("/api/chat", response_model=ChatResponse)
async def chat_message(request: ChatRequest, db: Session = Depends(get_db)):
    """Process a user message in the conversational booking flow"""
    session_id = request.session_id
    
    if not session_id:
        # Create new session if one doesn't exist
        session_id = str(uuid.uuid4())
        # Initialize it with proper database and Redis entries
        repo = BookingSessionRepository(db)
        # Use a placeholder user ID (in real app, this would come from auth)
        user_id = "123"  # Placeholder
        repo.create_session(user_id, session_id)
        redis_client.create_new_booking_session(user_id, session_id)
    else:
        # Get existing session
        repo = BookingSessionRepository(db)
        session = repo.get_session_by_id(session_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    
    # Get booking state from Redis
    session = repo.get_session_by_id(session_id)
    booking_state = redis_client.get_booking_state(session.user_id)
    
    # Get LangChain booking agent
    agent = get_booking_agent(redis_client, None, db)  # Removed cal_api_client dependency
    
    # Process message
    response = agent.process_message(request.message, booking_state)
    
    # Update session in database if state changed
    if booking_state != response.booking_state:
        updates = response.booking_state.model_dump()
        # Remove any fields that shouldn't be stored in DB
        for field in ["available_slots_raw", "presented_slots_text", "last_bot_message"]:
            if field in updates:
                updates.pop(field)
        repo.update_session(session_id, updates)
    
    return response

# --------------- Form Data Routes ---------------

@app.post("/api/update-booking-form/{session_id}")
async def update_booking_form(
    session_id: str,
    form_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Save partial booking form data to Redis session"""
    # Get session
    repo = BookingSessionRepository(db)
    session = repo.get_session_by_id(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update Redis state
    redis_client.update_booking_state(session.user_id, form_data)
    
    # Update session in database for fields that match the model
    valid_fields = [
        "patient_name", "patient_dob", "is_self_booking", "family_member_id",
        "reason", "location_preference", "specialty_preference", "doctor_preference"
    ]
    
    db_updates = {k: v for k, v in form_data.items() if k in valid_fields}
    if db_updates:
        repo.update_session(session_id, db_updates)
    
    return {"message": "Form data updated successfully", "session_id": session_id}

@app.post("/api/validate-patient-info")
async def validate_patient_info(
    patient_info: Dict[str, Any] = Body(...),
):
    """Validate patient information"""
    # Implement validation logic here
    errors = {}
    
    # Required fields
    required_fields = ["name", "dob"]
    for field in required_fields:
        if field not in patient_info or not patient_info[field]:
            errors[field] = f"{field} is required"
    
    # Date format validation for DOB
    if "dob" in patient_info and patient_info["dob"]:
        try:
            datetime.fromisoformat(patient_info["dob"])
        except ValueError:
            errors["dob"] = "Invalid date format. Use YYYY-MM-DD"
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

# --------------- Helper method for DoctorScheduleRepository ---------------

# Start the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)