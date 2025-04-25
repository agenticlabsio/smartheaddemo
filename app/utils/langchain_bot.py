# LangGraph + Langfuse powered HealthConnect Chatbot

import json
import redis
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import BaseOutputParser
from langgraph.graph import StateGraph, END
from langfuse.langchain import LangfuseTracer

# === Setup ===
# Redis Setup
redis_client = redis.Redis.from_url("your-upstash-url")

# Langfuse Tracer
tracer = LangfuseTracer()

# LLM Setup with tracing
llm = ChatOpenAI(temperature=0.3, model_name="gpt-4").with_config({
    "callbacks": [tracer],
    "metadata": {"flow": "appointment_booking"}
})

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

# === Nodes ===
def start_node(state: BookingState) -> BookingState:
    user_id = state.get("apolloUserId")
    session = load_session(user_id)
    state.update(session)
    return state

def patient_selection_node(state: BookingState) -> BookingState:
    prompt = ChatPromptTemplate.from_template("Who is this appointment for? Reply with 'myself' or 'someone else'.")
    chain = prompt | llm
    response = chain.invoke({})
    state["who_for"] = response.content.strip().lower()
    return state

def patient_details_node(state: BookingState) -> BookingState:
    if state["who_for"] == "myself":
        state["patient_name"] = state.get("name")
        state["dob"] = state.get("dob")
    else:
        prompt = ChatPromptTemplate.from_template("Please enter the patient's full name and date of birth.")
        chain = prompt | llm
        response = chain.invoke({})
        state["patient_name"] = response.content.strip()
        # Assume DOB follow-up in real impl
        state["dob"] = "1990-01-01"  # mock for now
    return state

def reason_node(state: BookingState) -> BookingState:
    prompt = ChatPromptTemplate.from_template("What is the reason for the appointment?")
    chain = prompt | llm
    response = chain.invoke({})
    state["reason"] = response.content.strip()
    return state

def preferences_node(state: BookingState) -> BookingState:
    prompt = ChatPromptTemplate.from_template(
        "Please provide your preferred Location and Specialty. You can also specify a Doctor if known."
    )
    chain = prompt | llm
    response = chain.invoke({})
    # Mock parsing for now
    state["location"] = "Apollo Main"
    state["specialty"] = "Dermatology"
    state["doctor"] = "Any Available"
    return state

def availability_node(state: BookingState) -> BookingState:
    # Simulate call to /api/doctor-availability
    state["available_slots"] = ["9:00 AM", "9:30 AM", "10:00 AM"]
    return state

def slot_selection_node(state: BookingState) -> BookingState:
    prompt = ChatPromptTemplate.from_template(
        f"Available slots: {', '.join(state['available_slots'])}. Which one do you want to book?"
    )
    chain = prompt | llm
    response = chain.invoke({})
    state["selected_slot"] = response.content.strip()
    return state

def summary_node(state: BookingState) -> BookingState:
    summary = f"Booking Summary:\nName: {state['patient_name']}\nDOB: {state['dob']}\nReason: {state['reason']}\nLocation: {state['location']}\nSpecialty: {state['specialty']}\nDoctor: {state['doctor']}\nSlot: {state['selected_slot']}\nConfirm?"
    prompt = ChatPromptTemplate.from_template(summary)
    chain = prompt | llm
    response = chain.invoke({})
    state["confirmed"] = response.content.strip().lower() == "yes"
    return state

def confirmation_node(state: BookingState) -> BookingState:
    if state.get("confirmed"):
        state["appointmentId"] = "MOCK123456"
    else:
        state["appointmentId"] = None
    return state

def exit_node(state: BookingState) -> BookingState:
    user_id = state.get("apolloUserId")
    save_session(user_id, state)
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
    user_context = {
        "apolloUserId": "u123",
        "name": "John Doe",
        "dob": "1990-01-01"
    }
    result = booking_graph.invoke(user_context)
    print("Booking Completed:", result.get("appointmentId"))