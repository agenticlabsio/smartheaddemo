from typing import Optional, Dict, Any, List, TypedDict, Annotated, Literal
import json
import os
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.graph import MessagesState
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

from models import (
    BookingState, ChatResponse, PatientOption, DoctorAvailabilityResponse,
    DoctorAvailabilityRequest, CalSlot
)
from repositories import (
    UserRepository, FamilyMemberRepository, DoctorRepository,
    SpecialtyRepository, LocationRepository, BookingSessionRepository
)
from redis_client import BookingStateRedisClient


# Add conversation history methods to the redis client (assume these are implemented)
def get_conversation_history(self, session_id: str) -> List:
    """Get conversation history from Redis"""
    try:
        history_json = self.redis.get(f"conversation:{session_id}")
        if history_json:
            return json.loads(history_json)
        return []
    except Exception:
        return []

def save_conversation_history(self, session_id: str, messages: List) -> bool:
    """Save conversation history to Redis"""
    try:
        # Serialize messages (need to convert to dict first)
        serializable_messages = []
        for msg in messages:
            if hasattr(msg, "dict"):
                serializable_messages.append(msg.dict())
            else:
                # Fallback for basic serialization
                msg_type = msg.__class__.__name__
                serializable_messages.append({
                    "type": msg_type,
                    "content": msg.content,
                })
        
        self.redis.set(f"conversation:{session_id}", json.dumps(serializable_messages))
        return True
    except Exception:
        return False

# Add methods to BookingStateRedisClient
BookingStateRedisClient.get_conversation_history = get_conversation_history
BookingStateRedisClient.save_conversation_history = save_conversation_history


# Define our state for the graph
class BookingGraphState(TypedDict):
    messages: list  # The conversation messages
    booking_state: dict  # The current booking state
    session_id: str  # The session ID


class BookingAgent:
    """Agent for handling conversational booking flow using LangGraph"""
    
    def __init__(self, redis_client: BookingStateRedisClient, db: Session):
        """Initialize the booking agent"""
        self.redis_client = redis_client
        self.db = db
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
        # Initialize the graph components
        self.setup_graph()
    
    def setup_graph(self):
        """Set up LangGraph components"""
        # Initialize the model
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.7, 
            api_key=self.openai_api_key
        )
        
        # Define tools
        @tool
        def get_patient_info(user_id: str) -> str:
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
        
        @tool
        def get_specialties() -> str:
            """Get all available medical specialties"""
            try:
                repo = SpecialtyRepository(self.db)
                specialties = repo.get_all_specialties()
                
                return json.dumps([{"id": str(s.id), "name": s.name, "description": s.description or ""} for s in specialties])
            except Exception as e:
                return f"Error getting specialties: {str(e)}"
        
        @tool
        def get_locations() -> str:
            """Get all available locations"""
            try:
                repo = LocationRepository(self.db)
                locations = repo.get_all_locations()
                
                return json.dumps([{"id": str(l.id), "name": l.name, "address": l.address} for l in locations])
            except Exception as e:
                return f"Error getting locations: {str(e)}"
        
        @tool
        def get_doctor_availability(query_string: str) -> str:
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
        
        @tool
        def update_booking_state(update_string: str) -> str:
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
        
        # Collect all tools
        self.tools = [
            get_patient_info,
            get_specialties,
            get_locations,
            get_doctor_availability,
            update_booking_state
        ]
        
        # Define the system message
        system_prompt = """
        You are a helpful medical appointment booking assistant. You help users book appointments with doctors.
        Your goal is to collect all necessary information to make a booking:
        1. Who is the appointment for (the user or family member)
        2. What specialty they need to see
        3. Preferred location (if any)
        4. Preferred doctor (if any)
        5. Reason for visit
        6. Preferred date/time
        
        Be friendly and conversational, but focused on gathering the required information.
        Use tools when you need to check information or update the booking state.
        Maintain a helpful, professional tone throughout the conversation.
        """
        
        # Create a ReAct agent using langgraph's prebuilt function
        self.agent_runnable = create_react_agent(self.llm, self.tools, prompt=system_prompt)
        
        # Create tool node for the graph
        self.tool_node = ToolNode(self.tools)
        
        # Define the function to run the agent
        def agent(state: BookingGraphState):
            """Agent to generate the next response or decide to use tools"""
            # Extract the messages and booking state
            messages = state["messages"]
            booking_state = state.get("booking_state", {})
            
            # Add booking state information to the human message if it exists
            if booking_state and messages and isinstance(messages[-1], HumanMessage):
                last_message = messages[-1]
                updated_content = f"Current booking state:\n{json.dumps(booking_state, indent=2)}\n\n{last_message.content}"
                modified_messages = messages[:-1] + [HumanMessage(content=updated_content)]
            else:
                modified_messages = messages
            
            # Invoke the agent with the messages
            agent_response = self.agent_runnable.invoke({"messages": modified_messages})
            
            # Return the updated messages and maintained state
            return {
                "messages": agent_response["messages"], 
                "booking_state": booking_state, 
                "session_id": state.get("session_id")
            }
        
        # Define state handler to determine the next step
        def should_continue(state: BookingGraphState) -> Literal["agent", "action", "end"]:
            """Determine whether to continue with the agent, use tools, or end"""
            # Get the last message
            messages = state["messages"]
            if not messages:
                return "agent"
            
            last_message = messages[-1]
            
            # If the last message has tool calls, use the action node
            if isinstance(last_message, AIMessage) and last_message.tool_calls:
                return "action"
            
            # Check if booking is complete
            booking_state = state.get("booking_state", {})
            required_fields = ["patient_id", "specialty_id", "doctor_id", "appointment_reason", "preferred_date"]
            if all(field in booking_state and booking_state[field] for field in required_fields):
                # Booking is complete, so we can end
                return "end"
            
            # Otherwise, continue with the agent
            return "agent"
        
        # Build the graph
        self.workflow = StateGraph(BookingGraphState)
        
        # Add nodes
        self.workflow.add_node("agent", agent)
        self.workflow.add_node("action", self.tool_node)
        
        # Add edges
        self.workflow.add_conditional_edges(
            "agent",
            should_continue,
            {
                "action": "action",
                "agent": "agent",
                "end": END
            }
        )
        self.workflow.add_conditional_edges(
            "action",
            should_continue,
            {
                "action": "action",
                "agent": "agent",
                "end": END
            }
        )
        
        # Set the entry point
        self.workflow.set_entry_point("agent")
        
        # Compile the graph
        self.app = self.workflow.compile()
    
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
            # Convert BookingState to dict for easier manipulation
            booking_state_dict = booking_state.model_dump(exclude_unset=True)
            
            # Get conversation history from Redis if available
            previous_messages = self.redis_client.get_conversation_history(booking_state.session_id) or []
            
            # Add the new message
            current_messages = previous_messages + [HumanMessage(content=message)]
            
            # Initialize the state with the current message
            state = {
                "messages": current_messages,
                "booking_state": booking_state_dict,
                "session_id": booking_state.session_id
            }
            
            # Run the graph
            result = self.app.invoke(state)
            
            # Extract the response
            messages = result["messages"]
            
            # Save updated conversation history to Redis
            self.redis_client.save_conversation_history(booking_state.session_id, messages)
            
            # Find the latest AI message
            ai_messages = [m for m in messages if isinstance(m, AIMessage)]
            
            if not ai_messages:
                return ChatResponse(
                    message="I'm sorry, I couldn't generate a response.",
                    booking_state=booking_state,
                    session_id=booking_state.session_id
                )
            
            # Get the last AI message content
            ai_response = ai_messages[-1].content
            
            # Extract any booking state updates from tool calls
            # Look for update_booking_state tool calls
            updated_state_dict = booking_state_dict.copy()
            
            for message in messages:
                if isinstance(message, ToolMessage):
                    # Check if this was an update_booking_state call
                    if "update_booking_state" in message.name:
                        try:
                            # Try to find state updates in the tool response
                            if "Booking state updated successfully" in message.content:
                                # Look for the preceding tool call to extract the updates
                                tool_call_index = messages.index(message) - 1
                                if tool_call_index >= 0 and isinstance(messages[tool_call_index], AIMessage):
                                    for tool_call in messages[tool_call_index].tool_calls:
                                        if tool_call.get("name") == "update_booking_state":
                                            # Extract the update data
                                            update_data = json.loads(tool_call.get("args", "{}"))
                                            # Remove user_id as it's not part of the booking state model
                                            if "user_id" in update_data:
                                                del update_data["user_id"]
                                            # Update the state dict
                                            updated_state_dict.update(update_data)
                        except (json.JSONDecodeError, IndexError, KeyError):
                            pass
            
            # If there were updates, update the Redis state
            if updated_state_dict != booking_state_dict:
                # Convert dict back to BookingState
                updated_booking_state = BookingState(**updated_state_dict)
                
                # Update Redis
                self.redis_client.update_booking_state(
                    booking_state.user_id, 
                    updated_state_dict
                )
            else:
                updated_booking_state = booking_state
            
            return ChatResponse(
                message=ai_response,
                booking_state=updated_booking_state,
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


def get_booking_agent(redis_client: BookingStateRedisClient, cal_api_client=None, db: Session = None) -> BookingAgent:
    """
    Factory function to create a booking agent
    
    Args:
        redis_client: Redis client for session state
        cal_api_client: Optional Cal.com API client (not used, kept for backward compatibility)
        db: Database session
        
    Returns:
        BookingAgent instance
    """
    return BookingAgent(redis_client, db)