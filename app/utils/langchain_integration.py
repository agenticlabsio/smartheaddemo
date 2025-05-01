from typing import Optional, Dict, Any, List
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain_community.llms import OpenAI
from langchain.agents import Tool, AgentExecutor, ZeroShotAgent
from langchain.output_parsers import PydanticOutputParser
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
import os

from models import (
    BookingState, ChatResponse, PatientOption, DoctorAvailabilityResponse,
    DoctorAvailabilityRequest, CalSlot
)
from repositories import (
    UserRepository, FamilyMemberRepository, DoctorRepository,
    SpecialtyRepository, LocationRepository, BookingSessionRepository
)
from redis_client import BookingStateRedisClient


class BookingAgent:
    """Agent for handling conversational booking flow"""
    
    def __init__(self, redis_client: BookingStateRedisClient, db: Session):
        """Initialize the booking agent"""
        self.redis_client = redis_client
        self.db = db
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
        # Initialize LangChain components
        self.setup_langchain()
    
    def setup_langchain(self):
        """Set up LangChain components"""
        # Initialize the LLM with OpenAI API key
        self.llm = OpenAI(temperature=0.7, openai_api_key=self.openai_api_key)
        
        # Define tools that the agent can use
        self.tools = [
            Tool(
                name="Get_Patient_Info",
                func=self.get_patient_info,
                description="Useful for getting patient information and options"
            ),
            Tool(
                name="Get_Specialties",
                func=self.get_specialties,
                description="Useful for getting available medical specialties"
            ),
            Tool(
                name="Get_Locations",
                func=self.get_locations,
                description="Useful for getting available clinic locations"
            ),
            Tool(
                name="Get_Doctor_Availability",
                func=self.get_doctor_availability,
                description="Useful for checking doctor availability based on specialty, location, or doctor name"
            ),
            Tool(
                name="Update_Booking_State",
                func=self.update_booking_state,
                description="Updates the current booking state with new information"
            )
        ]
        
        # Define the agent prompt
        prompt = ZeroShotAgent.create_prompt(
            self.tools,
            prefix="""You are a helpful medical appointment booking assistant. You help users book appointments with doctors.
            Your goal is to collect all necessary information to make a booking:
            1. Who is the appointment for (the user or family member)
            2. What specialty they need to see
            3. Preferred location (if any)
            4. Preferred doctor (if any)
            5. Reason for visit
            6. Preferred date/time
            
            Use the tools available to you to help with the booking process.
            """,
            suffix="""Begin!
            
            Previous conversation history:
            {chat_history}
            
            Current booking state:
            {booking_state}
            
            Human: {input}
            Agent:""",
            input_variables=["input", "chat_history", "booking_state"]
        )
        
        # Create memory for conversation history
        self.memory = ConversationBufferMemory(memory_key="chat_history")
        
        # Create the agent
        agent = ZeroShotAgent(llm_chain=ZeroShotAgent.create_llm_chain(self.llm, prompt), 
                              tools=self.tools, 
                              verbose=True)
        
        # Create the agent executor
        self.agent_executor = AgentExecutor.from_agent_and_tools(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            max_iterations=5
        )
    
    def process_message(self, message: str, booking_state: BookingState) -> ChatResponse:
        """
        Process a user message in the booking flow
        
        Args:
            message: User message
            booking_state: Current booking state
            
        Returns:
            ChatResponse with bot's response and updated booking state
        """
        try:
            # Format the booking state for the agent
            booking_state_str = json.dumps(booking_state.model_dump(exclude_unset=True), indent=2)
            
            # Execute the agent
            response = self.agent_executor.run(
                input=message,
                booking_state=booking_state_str
            )
            
            # Get the updated booking state
            updated_state = self.redis_client.get_booking_state(booking_state.user_id)
            
            # Return the response
            return ChatResponse(
                message=response,
                booking_state=updated_state or booking_state,
                session_id=booking_state.session_id
            )
        except Exception as e:
            # Handle errors
            error_message = f"I'm sorry, I encountered an error: {str(e)}"
            return ChatResponse(
                message=error_message,
                booking_state=booking_state,
                session_id=booking_state.session_id
            )
    
    # Tool implementation methods
    def get_patient_info(self, user_id: str) -> str:
        """Get patient information for the user and family members"""
        try:
            user_repo = UserRepository(self.db)
            family_repo = FamilyMemberRepository(self.db)
            
            user = user_repo.get_user_by_id(user_id)
            if not user:
                return "User not found"
            
            # Get family members
            family_members = family_repo.get_authorized_family_members(user_id)
            
            # Create patient options
            options = [
                {
                    "id": str(user.id),
                    "name": user.full_name,
                    "relationship": "SELF",
                    "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None
                }
            ]
            
            for member in family_members:
                options.append({
                    "id": str(member.id),
                    "name": member.full_name,
                    "relationship": member.relationship.value,
                    "date_of_birth": member.date_of_birth.isoformat() if member.date_of_birth else None
                })
            
            return json.dumps(options)
        except Exception as e:
            return f"Error getting patient info: {str(e)}"
    
    def get_specialties(self) -> str:
        """Get all available medical specialties"""
        try:
            repo = SpecialtyRepository(self.db)
            specialties = repo.get_all_specialties()
            
            return json.dumps([{"id": str(s.id), "name": s.name, "description": s.description or ""} for s in specialties])
        except Exception as e:
            return f"Error getting specialties: {str(e)}"
    
    def get_locations(self) -> str:
        """Get all available locations"""
        try:
            repo = LocationRepository(self.db)
            locations = repo.get_all_locations()
            
            return json.dumps([{"id": str(l.id), "name": l.name, "address": l.address} for l in locations])
        except Exception as e:
            return f"Error getting locations: {str(e)}"
    
    def get_doctor_availability(self, query_string: str) -> str:
        """
        Get doctor availability based on filters
        
        Args:
            query_string: JSON string with filters for specialty, location, doctor_name
                          Format: {"specialty": "...", "location": "...", "doctor_name": "..."}
        """
        try:
            # Parse query parameters
            params = json.loads(query_string)
            
            # Create request object
            request = DoctorAvailabilityRequest(
                specialty=params.get("specialty"),
                location=params.get("location"),
                doctor_name=params.get("doctor_name"),
                start_date=datetime.now().date(),
                end_date=(datetime.now() + timedelta(days=14)).date()
            )
            
            # Set up repositories
            doctor_repo = DoctorRepository(self.db)
            location_repo = LocationRepository(self.db)
            
            # Get doctors matching the criteria
            doctors = doctor_repo.get_doctors(
                specialty=request.specialty,
                location=request.location,
                doctor_name=request.doctor_name
            )
            
            if not doctors:
                return "No doctors found matching the criteria"
            
            # Build simplified availability information
            availability_info = []
            for doctor in doctors:
                # For simplicity in the AI response, just include doctor info
                availability_info.append({
                    "doctor_id": str(doctor.id),
                    "name": doctor.full_name,
                    "specialty": doctor.specialty,
                    "location": doctor.location.name if doctor.location else "Unknown"
                })
            
            return json.dumps(availability_info)
        except Exception as e:
            return f"Error checking doctor availability: {str(e)}"
    
    def update_booking_state(self, update_string: str) -> str:
        """
        Update the booking state
        
        Args:
            update_string: JSON string with fields to update
                          Format: {"user_id": "...", "field1": "value1", "field2": "value2"}
        """
        try:
            # Parse update parameters
            updates = json.loads(update_string)
            
            # Extract user_id
            user_id = updates.pop("user_id", None)
            if not user_id:
                return "Error: user_id is required"
            
            # Update Redis state
            updated_state = self.redis_client.update_booking_state(user_id, updates)
            
            if not updated_state:
                return "Failed to update booking state"
            
            return "Booking state updated successfully"
        except Exception as e:
            return f"Error updating booking state: {str(e)}"


def get_booking_agent(redis_client: BookingStateRedisClient, cal_api_client: Any, db: Session) -> BookingAgent:
    """
    Factory function to create a booking agent
    
    Args:
        redis_client: Redis client for session state
        cal_api_client: Cal.com API client (not used in this implementation)
        db: Database session
        
    Returns:
        BookingAgent instance
    """
    return BookingAgent(redis_client, db)