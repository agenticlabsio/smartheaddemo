import json
import redis
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import BaseOutputParser
from langgraph.graph import StateGraph, END
from langfuse import Langfuse

# === Setup ===
# Redis Setup
redis_client = redis.Redis.from_url("your-upstash-url")

# Langfuse Setup
langfuse = Langfuse(secret_key="sk-...", public_key="pk-...")

# LLM Setup
llm = ChatOpenAI(temperature=0.3, model_name="gpt-4")

# === State Schema ===
class BookingState(dict):
    pass

# === Session Helpers ===
def load_session(apollo_user_id):
    session = redis_client.get(f"session:apollo:{apollo_user_id}")
    if session:
        return json.loads(session)
    return {}

def save_session(apollo_user_id, data):
    redis_client.setex(f"session:apollo:{apollo_user_id}", 3600, json.dumps(data))

# === Nodes with Langfuse tracing ===
def start_node(state: BookingState) -> BookingState:
    trace = langfuse.trace(name="start_node")
    
    user_id = state.get("apolloUserId")
    trace.update(user_id=user_id)
    
    session = load_session(user_id)
    state.update(session)
    
    trace.end()
    return state

def patient_selection_node(state: BookingState) -> BookingState:
    trace = langfuse.trace(name="patient_selection_node")
    
    prompt = ChatPromptTemplate.from_template("Who is this appointment for? Reply with 'myself' or 'someone else'.")
    response = llm.invoke(prompt.format())
    
    # Log the LLM call to Langfuse
    trace.span(
        name="llm_patient_selection",
        input={"prompt": prompt.format()},
        output={"response": response.content}
    )
    
    state["who_for"] = response.content.strip().lower()
    
    trace.end()
    return state

def patient_details_node(state: BookingState) -> BookingState:
    trace = langfuse.trace(name="patient_details_node")
    
    if state["who_for"] == "myself":
        state["patient_name"] = state.get("name")
        state["dob"] = state.get("dob")
    else:
        prompt = ChatPromptTemplate.from_template("Please enter the patient's full name and date of birth.")
        response = llm.invoke(prompt.format())
        
        # Log the LLM call to Langfuse
        trace.span(
            name="llm_patient_details",
            input={"prompt": prompt.format()},
            output={"response": response.content}
        )
        
        state["patient_name"] = response.content.strip()
        # Assume DOB follow-up in real impl
        state["dob"] = "1990-01-01"  # mock for now
    
    trace.end()
    return state

def reason_node(state: BookingState) -> BookingState:
    trace = langfuse.trace(name="reason_node")
    
    prompt = ChatPromptTemplate.from_template("What is the reason for the appointment?")
    response = llm.invoke(prompt.format())
    
    # Log the LLM call to Langfuse
    trace.span(
        name="llm_reason",
        input={"prompt": prompt.format()},
        output={"response": response.content}
    )
    
    state["reason"] = response.content.strip()
    
    trace.end()
    return state

def preferences_node(state: BookingState) -> BookingState:
    trace = langfuse.trace(name="preferences_node")
    
    prompt = ChatPromptTemplate.from_template(
        "Please provide your preferred Location and Specialty. You can also specify a Doctor if known."
    )
    response = llm.invoke(prompt.format())
    
    # Log the LLM call to Langfuse
    trace.span(
        name="llm_preferences",
        input={"prompt": prompt.format()},
        output={"response": response.content}
    )
    
    # Mock parsing for now
    state["location"] = "Apollo Main"
    state["specialty"] = "Dermatology"
    state["doctor"] = "Any Available"
    
    trace.end()
    return state

def availability_node(state: BookingState) -> BookingState:
    trace = langfuse.trace(name="availability_node")
    
    # Simulate call to /api/doctor-availability
    state["available_slots"] = ["9:00 AM", "9:30 AM", "10:00 AM"]
    
    # Log the API call to Langfuse
    trace.span(
        name="api_availability",
        input={"location": state["location"], "specialty": state["specialty"], "doctor": state["doctor"]},
        output={"available_slots": state["available_slots"]}
    )
    
    trace.end()
    return state

def slot_selection_node(state: BookingState) -> BookingState:
    trace = langfuse.trace(name="slot_selection_node")
    
    prompt = ChatPromptTemplate.from_template(
        f"Available slots: {', '.join(state['available_slots'])}. Which one do you want to book?"
    )
    response = llm.invoke(prompt.format())
    
    # Log the LLM call to Langfuse
    trace.span(
        name="llm_slot_selection",
        input={"prompt": prompt.format()},
        output={"response": response.content}
    )
    
    state["selected_slot"] = response.content.strip()
    
    trace.end()
    return state

def summary_node(state: BookingState) -> BookingState:
    trace = langfuse.trace(name="summary_node")
    
    summary = f"Booking Summary:\nName: {state['patient_name']}\nDOB: {state['dob']}\nReason: {state['reason']}\nLocation: {state['location']}\nSpecialty: {state['specialty']}\nDoctor: {state['doctor']}\nSlot: {state['selected_slot']}\nConfirm?"
    prompt = ChatPromptTemplate.from_template(summary)
    response = llm.invoke(prompt.format())
    
    # Log the LLM call to Langfuse
    trace.span(
        name="llm_summary",
        input={"prompt": prompt.format()},
        output={"response": response.content}
    )
    
    state["confirmed"] = response.content.strip().lower() == "yes"
    
    trace.end()
    return state

def confirmation_node(state: BookingState) -> BookingState:
    trace = langfuse.trace(name="confirmation_node")
    
    if state.get("confirmed"):
        state["appointmentId"] = "MOCK123456"
    else:
        state["appointmentId"] = None
    
    # Log the confirmation status to Langfuse
    trace.span(
        name="appointment_status",
        input={"confirmed": state.get("confirmed")},
        output={"appointmentId": state.get("appointmentId")}
    )
    
    trace.end()
    return state

def exit_node(state: BookingState) -> BookingState:
    trace = langfuse.trace(name="exit_node")
    
    user_id = state.get("apolloUserId")
    save_session(user_id, state)
    
    trace.end()
    return state

# === LangGraph ===
graph = StateGraph()

graph.add_node("start", start_node)
graph.add_node("select_patient", patient_selection_node)
graph.add_node("patient_details", patient_details_node)
graph.add_node("reason", reason_node)
graph.add_node("preferences", preferences_node)
graph.add_node("availability", availability_node)
graph.add_node("slot_selection", slot_selection_node)
graph.add_node("summary", summary_node)
graph.add_node("confirmation", confirmation_node)
graph.add_node("exit", exit_node)

graph.set_entry_point("start")

graph.add_edge("start", "select_patient")
graph.add_edge("select_patient", "patient_details")
graph.add_edge("patient_details", "reason")
graph.add_edge("reason", "preferences")
graph.add_edge("preferences", "availability")
graph.add_edge("availability", "slot_selection")
graph.add_edge("slot_selection", "summary")
graph.add_edge("summary", "confirmation")
graph.add_edge("confirmation", "exit")

graph.set_finish_point("exit")

booking_graph = graph.compile()

# === Run Example ===
if __name__ == "__main__":
    # Create a session-level trace
    session_trace = langfuse.trace(name="booking_session")
    session_trace.update(tags=["appointment_booking"])
    
    user_context = {
        "apolloUserId": "u123",
        "name": "John Doe",
        "dob": "1990-01-01"
    }
    
    session_trace.update(user_id=user_context["apolloUserId"], session_id=f"session:{user_context['apolloUserId']}")
    
    result = booking_graph.invoke(user_context)
    
    # Add final result to trace
    session_trace.span(
        name="booking_result", 
        input=user_context,
        output={"appointmentId": result.get("appointmentId")}
    )
    
    print("Booking Completed:", result.get("appointmentId"))
    
    # Make sure all traces are sent to Langfuse
    langfuse.flush()