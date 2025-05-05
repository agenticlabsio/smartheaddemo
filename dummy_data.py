#!/usr/bin/env python3
"""
Script to generate and insert dummy data into the ABC Hospital Network database.
This creates realistic test data for development and testing purposes.
"""

import random
import string
import argparse
from datetime import datetime, timedelta, time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from faker import Faker
from werkzeug.security import generate_password_hash
from app.models import (
    Base, User, FamilyMember, Doctor, Location, Specialty,
    DoctorSchedule, Appointment, BookingSession,
    RelationshipTypeEnum, AppointmentStatusEnum, BookingSessionStatusEnum
)

# Initialize faker
fake = Faker()

# Constants for data generation
SPECIALTIES = [
    "Cardiology", "Dermatology", "Endocrinology", "Family Medicine", 
    "Gastroenterology", "Hematology", "Immunology", "Infectious Disease", 
    "Internal Medicine", "Nephrology", "Neurology", "Obstetrics & Gynecology", 
    "Oncology", "Ophthalmology", "Orthopedics", "Otolaryngology", 
    "Pediatrics", "Psychiatry", "Pulmonology", "Radiology", "Rheumatology", 
    "Urology"
]

LOCATIONS = [
    {
        "name": "ABC Hospital Downtown",
        "address": "123 Main Street, Downtown, ABC City 10001",
        "phone": "555-123-4567"
    },
    {
        "name": "ABC Medical Center West",
        "address": "456 West Avenue, Westside, ABC City 10002",
        "phone": "555-234-5678"
    },
    {
        "name": "ABC Family Clinic North",
        "address": "789 North Boulevard, Northville, ABC City 10003",
        "phone": "555-345-6789"
    },
    {
        "name": "ABC Specialty Center",
        "address": "321 Specialist Road, Midtown, ABC City 10004",
        "phone": "555-456-7890"
    },
    {
        "name": "ABC Children's Hospital",
        "address": "654 Pediatric Lane, Eastside, ABC City 10005",
        "phone": "555-567-8901"
    }
]

def create_specialties(session, num_specialties=None):
    """Create medical specialties"""
    print("Creating specialties...")
    specialties = []
    
    # Use all predefined specialties or limit to num_specialties
    specs_to_create = SPECIALTIES
    if num_specialties and num_specialties < len(SPECIALTIES):
        specs_to_create = random.sample(SPECIALTIES, num_specialties)
    
    for specialty_name in specs_to_create:
        specialty = Specialty(
            name=specialty_name,
            description=fake.paragraph(nb_sentences=3)
        )
        session.add(specialty)
        specialties.append(specialty)
    
    session.commit()
    return specialties

def create_locations(session):
    """Create hospital locations"""
    print("Creating locations...")
    locations = []
    
    for loc_data in LOCATIONS:
        location = Location(
            name=loc_data["name"],
            address=loc_data["address"],
            phone=loc_data["phone"],
            is_active=True
        )
        session.add(location)
        locations.append(location)
    
    session.commit()
    return locations

def create_users(session, num_users=50):
    """Create user accounts"""
    print(f"Creating {num_users} users...")
    users = []
    
    for _ in range(num_users):
        gender = random.choice(["male", "female"])
        first_name = fake.first_name_male() if gender == "male" else fake.first_name_female()
        last_name = fake.last_name()
        username = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}"
        
        # Generate a date of birth between 18-85 years ago
        dob = fake.date_of_birth(minimum_age=18, maximum_age=85)
        
        user = User(
            username=username,
            email=f"{username}@example.com",
            hashed_password=generate_password_hash("password123"),
            full_name=f"{first_name} {last_name}",
            date_of_birth=dob,
            phone_number=fake.phone_number(),
            address=fake.address().replace('\n', ', '),
            is_active=True,
            created_at=fake.date_time_between(start_date="-2y", end_date="now"),
        )
        session.add(user)
        users.append(user)
    
    session.commit()
    return users

def create_family_members(session, users, avg_family_members=2):
    """Create family members for users"""
    print("Creating family members...")
    family_members = []
    
    for user in users:
        # Decide how many family members this user has
        num_family_members = max(0, int(random.normalvariate(avg_family_members, 1.5)))
        
        for _ in range(num_family_members):
            relation = random.choice(list(RelationshipTypeEnum))
            
            # Determine appropriate age based on relationship
            if relation == RelationshipTypeEnum.CHILD:
                # Children are younger
                dob = fake.date_of_birth(minimum_age=1, maximum_age=30)
            elif relation == RelationshipTypeEnum.PARENT:
                # Parents are older
                dob = fake.date_of_birth(minimum_age=40, maximum_age=90)
            elif relation == RelationshipTypeEnum.SPOUSE:
                # Spouses are similar age
                user_age = (datetime.now().date() - user.date_of_birth.date()).days // 365
                dob = fake.date_of_birth(minimum_age=max(18, user_age - 10), maximum_age=user_age + 10)
            elif relation == RelationshipTypeEnum.SIBLING:
                # Siblings are similar age
                user_age = (datetime.now().date() - user.date_of_birth.date()).days // 365
                dob = fake.date_of_birth(minimum_age=max(1, user_age - 15), maximum_age=user_age + 15)
            else:
                # Other relations can be any age
                dob = fake.date_of_birth(minimum_age=1, maximum_age=90)
            
            gender = random.choice(["male", "female"])
            first_name = fake.first_name_male() if gender == "male" else fake.first_name_female()
            last_name = user.full_name.split()[-1] if relation in [RelationshipTypeEnum.CHILD, RelationshipTypeEnum.SPOUSE] else fake.last_name()
            
            family_member = FamilyMember(
                user_id=user.id,
                full_name=f"{first_name} {last_name}",
                date_of_birth=dob,
                relation_type=relation,
                is_authorized=True,
                created_at=fake.date_time_between(start_date=user.created_at, end_date="now")
            )
            session.add(family_member)
            family_members.append(family_member)
    
    session.commit()
    return family_members

def create_doctors(session, locations, num_doctors=40):
    """Create doctors across different specialties and locations"""
    print(f"Creating {num_doctors} doctors...")
    doctors = []
    
    for _ in range(num_doctors):
        # Get a random location
        location = random.choice(locations)
        
        gender = random.choice(["male", "female"])
        first_name = fake.first_name_male() if gender == "male" else fake.first_name_female()
        last_name = fake.last_name()
        
        doctor = Doctor(
            full_name=f"Dr. {first_name} {last_name}",
            specialty=random.choice(SPECIALTIES),
            location_id=location.id,
            is_active=random.random() > 0.05  # 5% chance of inactive
        )
        session.add(doctor)
        doctors.append(doctor)
    
    session.commit()
    return doctors

def create_doctor_schedules(session, doctors):
    """Create weekly schedules for doctors"""
    print("Creating doctor schedules...")
    schedules = []
    
    for doctor in doctors:
        # Each doctor works 3-5 days a week
        working_days = random.sample(range(7), random.randint(3, 5))
        
        for day in working_days:
            # Morning or afternoon shift
            is_morning = random.random() > 0.5
            
            if is_morning:
                # Morning shift: 8 AM - 12 PM
                start_hour = random.randint(8, 9)
                base_start = time(hour=start_hour, minute=random.choice([0, 30]))
                end_hour = random.randint(start_hour + 3, 12)
                base_end = time(hour=end_hour, minute=random.choice([0, 30]))
            else:
                # Afternoon shift: 1 PM - 5 PM
                start_hour = random.randint(13, 14)
                base_start = time(hour=start_hour, minute=random.choice([0, 30]))
                end_hour = random.randint(start_hour + 3, 17)
                base_end = time(hour=end_hour, minute=random.choice([0, 30]))
            
            # Convert to datetime for SQLAlchemy compatibility
            today = datetime.today().date()
            start_time = datetime.combine(today, base_start)
            end_time = datetime.combine(today, base_end)
            
            schedule = DoctorSchedule(
                doctor_id=doctor.id,
                day_of_week=day,  # 0-6 for Monday-Sunday
                start_time=start_time,
                end_time=end_time,
                is_available=doctor.is_active
            )
            session.add(schedule)
            schedules.append(schedule)
    
    session.commit()
    return schedules

def create_appointments(session, users, family_members, doctors, locations, num_appointments=200):
    """Create appointments for users and family members"""
    print(f"Creating {num_appointments} appointments...")
    appointments = []
    
    # Get active doctors only
    active_doctors = [d for d in doctors if d.is_active]
    
    # Generate appointments over a 6-month period
    start_date = datetime.now() - timedelta(days=90)  # 3 months ago
    end_date = datetime.now() + timedelta(days=90)    # 3 months in future
    
    for _ in range(num_appointments):
        doctor = random.choice(active_doctors)
        user = random.choice(users)
        
        # 60% chance appointment is for user, 40% for family member
        is_for_user = random.random() < 0.6
        family_member_id = None
        
        if not is_for_user:
            # Get family members for this user
            user_family = [fm for fm in family_members if fm.user_id == user.id]
            if user_family:  # If user has family members
                family_member = random.choice(user_family)
                family_member_id = family_member.id
            else:
                # No family members, appointment is for user
                is_for_user = True
        
        # Generate a random date between start_date and end_date
        appt_date = fake.date_time_between(start_date=start_date, end_date=end_date)
        
        # Round to 30-minute increments
        minute = 0 if appt_date.minute < 30 else 30
        appt_date = appt_date.replace(minute=minute, second=0, microsecond=0)
        
        # Make sure it's during business hours (8 AM - 5 PM)
        while appt_date.hour < 8 or appt_date.hour >= 17:
            appt_date = fake.date_time_between(start_date=start_date, end_date=end_date)
            minute = 0 if appt_date.minute < 30 else 30
            appt_date = appt_date.replace(minute=minute, second=0, microsecond=0)
        
        # Set appropriate status based on date
        if appt_date < datetime.now():
            status = random.choices(
                [AppointmentStatusEnum.COMPLETED, AppointmentStatusEnum.CANCELED],
                weights=[0.85, 0.15]
            )[0]
        else:
            days_until_appt = (appt_date - datetime.now()).days
            if days_until_appt < 3:
                # Upcoming soon - likely confirmed
                status = random.choices(
                    [AppointmentStatusEnum.CONFIRMED, AppointmentStatusEnum.RESCHEDULED],
                    weights=[0.9, 0.1]
                )[0]
            else:
                # Further out - could be just requested
                status = random.choices(
                    [AppointmentStatusEnum.REQUESTED, AppointmentStatusEnum.CONFIRMED],
                    weights=[0.4, 0.6]
                )[0]
        
        # Generate confirmation ID
        confirmation_id = f"BK-{fake.random_number(digits=5)}"
        
        # Common reasons for appointments
        reasons = [
            "Annual physical examination",
            "Follow-up appointment",
            "Consultation",
            "Routine check-up",
            "Vaccination",
            "Chronic condition management",
            "Acute illness",
            "Prescription renewal",
            "Lab results discussion",
            "Specialist referral"
        ]
        
        appointment = Appointment(
            user_id=user.id,
            family_member_id=family_member_id,
            doctor_id=doctor.id,
            location_id=doctor.location_id,
            date_time=appt_date,
            duration_minutes=random.choice([15, 30, 45, 60]),
            reason=random.choice(reasons),
            status=status,
            notes=fake.text(max_nb_chars=200) if random.random() > 0.7 else None,
            confirmation_id=confirmation_id,
            created_at=fake.date_time_between(
                start_date="-30d", 
                end_date=min(appt_date, datetime.now())
            )
        )
        session.add(appointment)
        appointments.append(appointment)
        
        # Commit in batches to avoid memory issues
        if len(appointments) % 50 == 0:
            session.commit()
    
    session.commit()
    return appointments

def create_booking_sessions(session, users, family_members, num_sessions=30):
    """Create booking sessions to simulate chat-based booking flow"""
    print(f"Creating {num_sessions} booking sessions...")
    booking_sessions = []
    
    for _ in range(num_sessions):
        user = random.choice(users)
        
        # Generate a unique session ID
        session_id = ''.join(random.choices(string.ascii_letters + string.digits, k=20))
        
        # 60% complete, 20% in progress, 20% failed/abandoned
        status_choice = random.random()
        if status_choice < 0.6:
            status = BookingSessionStatusEnum.COMPLETED
        elif status_choice < 0.8:
            status = BookingSessionStatusEnum.IN_PROGRESS
        else:
            status = random.choice([BookingSessionStatusEnum.FAILED, BookingSessionStatusEnum.ABANDONED])
        
        # 60% chance booking is for user, 40% for family member
        is_self_booking = random.random() < 0.6
        family_member_id = None
        patient_name = user.full_name
        patient_dob = user.date_of_birth
        
        if not is_self_booking:
            # Get family members for this user
            user_family = [fm for fm in family_members if fm.user_id == user.id]
            if user_family:  # If user has family members
                family_member = random.choice(user_family)
                family_member_id = family_member.id
                patient_name = family_member.full_name
                patient_dob = family_member.date_of_birth
            else:
                # No family members, booking is for user
                is_self_booking = True
        
        created_at = fake.date_time_between(start_date="-30d", end_date="now")
        
        # Common reasons for appointments
        reasons = [
            "Annual physical examination",
            "Follow-up appointment",
            "Consultation",
            "Routine check-up",
            "Vaccination",
            "Chronic condition management",
            "Acute illness",
            "Prescription renewal",
            "Lab results discussion",
            "Specialist referral"
        ]
        
        # Set last_node based on status
        if status == BookingSessionStatusEnum.COMPLETED:
            last_node = "confirmation"
            booking_id = f"BK-{fake.random_number(digits=5)}"
            selected_slot = fake.date_time_between(start_date="now", end_date="+30d")
        elif status == BookingSessionStatusEnum.IN_PROGRESS:
            last_node = random.choice(["collect_reason", "select_patient", "select_specialty", "select_slot"])
            booking_id = None
            selected_slot = None if last_node != "select_slot" else fake.date_time_between(start_date="now", end_date="+30d")
        else:
            last_node = random.choice(["collect_reason", "select_patient", "select_specialty", "select_slot"])
            booking_id = None
            selected_slot = None
            
        # Error message for failed sessions
        error_message = None
        if status == BookingSessionStatusEnum.FAILED:
            error_messages = [
                "No available appointments found for the requested time period.",
                "Doctor unavailable at the selected time.",
                "Failed to validate patient information.",
                "Session timed out due to inactivity.",
                "System error occurred during booking process."
            ]
            error_message = random.choice(error_messages)
        
        booking_session = BookingSession(
            session_id=session_id,
            user_id=user.id,
            is_self_booking=is_self_booking,
            family_member_id=family_member_id,
            patient_name=patient_name,
            patient_dob=patient_dob,
            reason=random.choice(reasons) if status != BookingSessionStatusEnum.INITIALIZED else None,
            location_preference=random.choice([loc["name"] for loc in LOCATIONS]) if random.random() > 0.5 else None,
            specialty_preference=random.choice(SPECIALTIES) if random.random() > 0.5 else None,
            doctor_preference=None,  # Usually collected during conversation
            selected_slot=selected_slot,
            booking_id=booking_id,
            status=status,
            last_node=last_node,
            error_message=error_message,
            created_at=created_at,
            updated_at=created_at + timedelta(minutes=random.randint(5, 30)),
            expires_at=datetime.now() + timedelta(days=1)
        )
        session.add(booking_session)
        booking_sessions.append(booking_session)
    
    session.commit()
    return booking_sessions

def main():
    parser = argparse.ArgumentParser(description="Generate dummy data for ABC Hospital Network database")
    parser.add_argument("--db-url", type=str, default="sqlite:///hospital_network.db", 
                      help="Database URL (default: sqlite:///hospital_network.db)")
    parser.add_argument("--users", type=int, default=50, 
                      help="Number of users to create (default: 50)")
    parser.add_argument("--doctors", type=int, default=40, 
                      help="Number of doctors to create (default: 40)")
    parser.add_argument("--appointments", type=int, default=200, 
                      help="Number of appointments to create (default: 200)")
    parser.add_argument("--sessions", type=int, default=30, 
                      help="Number of booking sessions to create (default: 30)")
    parser.add_argument("--drop-tables", action="store_true", 
                      help="Drop existing tables before creating new ones")
    
    args = parser.parse_args()
    
    # Connect to database
    engine = create_engine(args.db_url)
    
    # Drop tables if requested
    if args.drop_tables:
        print("Dropping existing tables...")
        Base.metadata.drop_all(engine)
    
    # Create tables
    print("Creating tables...")
    Base.metadata.create_all(engine)
    
    # Create session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Create data
        specialties = create_specialties(session)
        locations = create_locations(session)
        users = create_users(session, num_users=args.users)
        family_members = create_family_members(session, users)
        doctors = create_doctors(session, locations, num_doctors=args.doctors)
        doctor_schedules = create_doctor_schedules(session, doctors)
        appointments = create_appointments(session, users, family_members, doctors, locations, num_appointments=args.appointments)
        booking_sessions = create_booking_sessions(session, users, family_members, num_sessions=args.sessions)
        
        print("\nDone! Data summary:")
        print(f"- {len(specialties)} specialties")
        print(f"- {len(locations)} locations")
        print(f"- {len(users)} users")
        print(f"- {len(family_members)} family members")
        print(f"- {len(doctors)} doctors")
        print(f"- {len(doctor_schedules)} doctor schedules")
        print(f"- {len(appointments)} appointments")
        print(f"- {len(booking_sessions)} booking sessions")
        
    except Exception as e:
        print(f"Error generating data: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()