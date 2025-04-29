Okay, here is a revised Product Requirements Document (PRD), User Stories, and Technical Stack description for "Chatbook," incorporating your feedback, focusing on a single-phase, chat-based implementation using the specified technologies and removing "Apollo Health."

---

**Product Requirements Document: Chatbook**

**Version:** 1.0
**Date:** 2024-05-23
**Project:** Chatbook - Conversational Appointment Scheduling

**1. Introduction**

*   **1.1. Purpose:** This document outlines the product requirements for Chatbook, a conversational AI feature integrated within the existing **ABC Hospital Network** customer application (web/mobile). Chatbook enables users to schedule medical appointments through a natural language chat interface, interacting with the underlying Cal.com booking system via API wrappers.
*   **1.2. Project Vision:** To provide ABC Hospital Network users with a seamless, intuitive, and efficient way to schedule medical appointments directly within their trusted application environment using a conversational AI assistant.
*   **1.3. Problem Statement:** Traditional appointment scheduling often involves navigating complex forms or making phone calls. Users of the ABC Hospital Network application desire a quicker, more natural way to book appointments for themselves and authorized family members, leveraging their existing logged-in context. Chatbook addresses this by providing an intelligent chat interface.
*   **1.4. Target Audience:**
    *   **Primary:** Existing registered users of the **ABC Hospital Network** application seeking to book medical appointments for themselves or authorized dependents/family members via chat.
*   **1.5. Scope Overview:** This PRD covers the implementation of the Chatbook conversational booking feature. It focuses on delivering a functional chat interface powered by Langchain/LangGraph and an LLM (e.g., OpenAI via Langchain), handling intent recognition, natural language understanding for extracting booking details, simplified patient selection using pre-authorized family members, interacting with wrapped Cal.com APIs for availability/booking, using Redis for session state management, and integrating Langfuse for observability.

**2. Goals & Objectives**

*   **2.1. Product Goals:**
    *   Successfully integrate a user-friendly conversational appointment booking feature (Chatbook) into the ABC Hospital Network application.
    *   Enable users to book appointments using natural language interactions.
    *   Accurately recognize user intent to book an appointment.
    *   Effectively extract required booking information (patient, reason, preferences, time) from the conversation.
    *   Streamline patient selection by offering pre-populated options for the user and known family members.
    *   Provide clear conversational feedback, present available slots effectively, and confirm bookings within the chat interface.
    *   Establish robust backend conversational logic using LangGraph and manage chat state using Redis.
    *   Implement comprehensive observability using Langfuse to monitor and improve the conversational flow and LLM interactions.
*   **2.2. Business Objectives:**
    *   Launch the Chatbook feature within the ABC Hospital Network app.
    *   Improve user satisfaction and engagement with the in-app appointment scheduling process.
    *   Reduce friction in the booking process, potentially leading to faster scheduling.
    *   Validate the effectiveness and usability of the conversational interface through user feedback and analytics (via Langfuse).
    *   Ensure secure and reliable interaction with underlying booking systems (Cal.com via wrapper).
*   **2.3. Success Metrics:**
    *   **Intent Recognition Accuracy:** >95% accuracy in identifying user intent to book an appointment (measured via Semantic Router/classifier logs and Langfuse traces).
    *   **Task Completion Rate (Chat):** >85% of users who initiate a booking conversation successfully reach a confirmed booking or a clear "no slots available" state without needing to abandon the chat due to confusion or errors.
    *   **Conversation Quality Score (via Langfuse/Manual Review):** High scores based on factors like turn efficiency, sentiment analysis, and error recovery during interactions.
    *   **Slot Selection Success:** >90% of presented available slots lead to a successful selection or clear user decision (e.g., "None of those work").
    *   **Booking Success Rate (via API):** High success rate for `POST /bookings` calls triggered from the chat flow (excluding deliberate user cancellations or simulated conflicts).
    *   **User Satisfaction (Qualitative):** Positive feedback via in-app surveys or reviews regarding the ease of use, naturalness, and efficiency of the Chatbook feature.

**3. Intent Recognition & Initiation**

*   **3.1. Requirement:** Before initiating the detailed booking workflow (LangGraph), the system must reliably detect the user's intent to schedule an appointment based on their initial chat message(s).
*   **3.2. Implementation:**
    *   Utilize a **Semantic Router** (e.g., from Langchain or a similar library) or a dedicated intent classification model/prompt.
    *   Train/configure the router to distinguish "book appointment" intent from other potential user queries (e.g., asking for hospital information, checking existing appointments, general chat).
    *   **Input:** User's chat message.
    *   **Output:** Classification (e.g., "BOOK_APPOINTMENT", "GENERAL_QUERY", "UNKNOWN") and potentially extracted initial entities (like specialty or reason if mentioned upfront).
    *   **Action:** If "BOOK_APPOINTMENT" intent is detected with high confidence, initiate the Chatbook LangGraph booking flow. Otherwise, respond appropriately (e.g., handle general query, ask for clarification).
    *   **Observability:** Log intent classification results and confidence scores to **Langfuse** for monitoring and fine-tuning.

**4. User Stories & Interaction Workflows (Chat-Based)**

*   **4.1. Expanded User Stories:**
    *   **US1 (Initiation & Intent):** As a logged-in ABC Hospital Network app user, when I type a message like "I need to book an appointment" or "Schedule a check-up for my daughter," I want the system to recognize my intent to book and start the Chatbook scheduling conversation, using my logged-in context (User ID, associated family members).
        *   *AC:* Semantic Router/Intent Classifier identifies booking intent; LangGraph `start_node` is triggered; User context (UserID, pre-authorized family member list) is loaded (potentially from Redis session or initial API call); Langfuse trace initiated for the session.
    *   **US2 (Patient Selection - Simplified):** As a user starting the booking chat, when asked "Who is this appointment for?", I want the chatbot to present options including "Myself" and the names of my pre-authorized family members (e.g., "Jane Doe (Child)", "John Doe Sr. (Parent)"), so I can easily select the patient without typing their full details.
        *   *AC:* Chatbot presents interactive options (buttons/list); Options include "Myself" and known dependents fetched based on UserID; User selects one option; Selection stored in LangGraph state (`BookingState`); Patient Name/DOB (if known for selected person) are populated in the state. Langfuse logs the selection step.
    *   **US3 (Patient Details Confirmation/Collection):** As a user, if I select a family member whose details (like DOB) are not fully known or need confirmation, I want the chatbot to politely ask for the necessary information (e.g., "Could you please confirm Jane's date of birth?"), so the booking can proceed accurately.
        *   *AC:* Chatbot checks `BookingState` for missing required patient info (Name, DOB); If missing, asks clarifying question; Extracts information from user response using LLM/Pydantic; Updates `BookingState`; Validates data format (e.g., DOB) using Pydantic. Langfuse logs the collection/confirmation step.
    *   **US4 (Reason for Appointment):** As a user, when the chatbot asks "What's the main reason for this appointment?", I want to state the reason in my own words (e.g., "annual physical," "sore throat," "follow-up for my knee"), so the bot can capture this context.
        *   *AC:* Chatbot prompts for reason; Extracts reason from user's natural language response; Stores extracted reason in `BookingState`. Langfuse logs the LLM interaction.
    *   **US5 (Appointment Preferences - Conversational):** As a user, I want the chatbot to guide me through providing preferences like Location (e.g., "Which hospital or clinic location works best?"), Specialty (e.g., "What specialty do you need? Like Cardiology or Dermatology?"), and optionally a specific Doctor (e.g., "Do you have a preferred doctor, or is any available doctor okay?"), so the system can find relevant slots.
        *   *AC:* Chatbot asks for preferences sequentially or based on conversation flow; Extracts Location, Specialty, Doctor preference using NLU; Handles potential ambiguity (e.g., "Near downtown" -> maps to specific clinics); Stores preferences in `BookingState`; Uses Pydantic models (like `UserUpdateRequest` fields) for validation. Langfuse logs each preference extraction step.
    *   **US6 (Fetching & Presenting Availability):** As a user, after providing my preferences, I want the chatbot to inform me it's looking for slots (e.g., "Okay, let me check availability for a Dermatologist at Main Campus...") and then present the available mock appointment slots clearly within the chat (e.g., "I found these times for next Tuesday, May 28th: 9:00 AM, 9:30 AM, 10:15 AM. Do any of these work?"), so I can easily choose one.
        *   *AC:* LangGraph node calls the backend API (`GET /bookings/slots` via `main.py` wrapper) with parameters from `BookingState`; Chatbot shows a brief "checking" message; Presents returned slots conversationally (grouped by date, clearly listed times); Handles "no slots found" gracefully (e.g., "Sorry, I couldn't find any open slots with those preferences. Would you like to try a different location or date?"). Langfuse logs the API call and the presented slots.
    *   **US7 (Selecting a Slot - Conversational):** As a user viewing the presented slots in the chat, I want to be able to select one by simply stating it (e.g., "9:30 AM looks good," "The first one," "Tuesday at 10:15"), so the bot confirms my choice.
        *   *AC:* Chatbot uses NLU to understand the user's selection from the presented options; Confirms the chosen slot back to the user (e.g., "Great, I'll select Tuesday, May 28th at 9:30 AM for you."); Updates `BookingState` with the `selected_slot` (using the precise timestamp format required by the API). Langfuse logs the selection and confirmation.
    *   **US8 (Reviewing Summary - Conversational):** As a user, before finalizing, I want the chatbot to provide a concise summary of the booking details (e.g., "Okay, just to confirm: This is for Jane Doe (DOB: 2010-05-15) for a 'sore throat' with any available Dermatologist at Main Campus on Tuesday, May 28th at 9:30 AM. Is that correct?"), so I can give a final confirmation.
        *   *AC:* LangGraph `summary_node` formats data from `BookingState`; Chatbot presents the summary clearly; Asks for confirmation ("Yes/No" or similar). Langfuse logs the summary presentation.
    *   **US9 (Confirming Booking - Conversational):** As a user, after confirming the summary is correct (e.g., by replying "Yes" or "Looks good"), I want the chatbot to attempt the booking and inform me of the outcome.
        *   *AC:* User confirms summary; LangGraph `confirmation_node` triggers API call (`POST /bookings` via wrapper) using data from `BookingState`; Chatbot shows processing message (e.g., "Booking that for you now..."). Langfuse logs the confirmation attempt.
    *   **US10 (Confirmation Message - Conversational):** As a user, immediately after a successful booking attempt, I want the chatbot to provide a clear confirmation message within the chat, including key details and the mock Confirmation ID (e.g., "All set! Your appointment is confirmed for Jane Doe with Dr. Emily Carter (Dermatology) at Main Campus on Tuesday, May 28th at 9:30 AM. Your confirmation ID is BK-12345."), so I have assurance.
        *   *AC:* API call returns success (2xx status) with booking details (including potentially assigned doctor if "any" was chosen) and `booking.id`/`uid`; Chatbot formats and presents the success message; `BookingState` updated with confirmation details; LangGraph transitions to `exit_node`. Langfuse logs the successful confirmation details.
    *   **US11 (Handling Booking Failures - Conversational):** As a user, if the booking attempt fails (e.g., simulated slot conflict, API error), I want the chatbot to inform me clearly and suggest next steps (e.g., "Oh, it looks like that 9:30 AM slot was just taken. Would you like to see other available times?" or "There was an issue booking that appointment. Should we try again?"), so I'm not left wondering.
        *   *AC:* API call returns an error (e.g., 409 Conflict, 500); LangGraph captures the error; Chatbot presents a user-friendly error message based on the error type; Guides user back to an appropriate step (e.g., slot selection, retry confirmation). Langfuse logs the failed booking attempt and the presented error message.
    *   **US12 (Handling Ambiguity & Corrections):** As a user interacting with the chatbot, if the bot misunderstands me or extracts incorrect information, I want to be able to correct it easily within the conversation (e.g., "No, I meant Dr. *Smith*, not Dr. Jones," or "Actually, the appointment is for *me*."), so the bot adjusts the `BookingState` accordingly.
        *   *AC:* NLU/LLM prompts designed to handle corrections; LangGraph includes logic to potentially loop back to previous nodes based on user feedback; `BookingState` is updated upon correction. Langfuse traces show correction loops.
    *   **US13 (Session Management & Context):** As a user having a conversation with Chatbook, I expect the bot to remember the context of our current booking attempt within the same session (e.g., who the patient is, the reason stated earlier), so I don't have to repeat myself constantly. If I get interrupted and return shortly after, I'd like to resume roughly where I left off.
        *   *AC:* `BookingState` managed by LangGraph persists throughout the conversation session; State is stored/updated in Redis linked to the user's session/ID (`redis_client.py` functions used); Short TTL allows for brief interruptions and resumption. Langfuse traces link spans within the same session ID.
    *   **US14 (Exiting Conversation):** As a user, when the booking is complete or if I decide to cancel the process, I want to be able to end the chat interaction naturally (e.g., "Thanks, that's all," "Cancel booking"), and the bot should acknowledge and end the flow gracefully.
        *   *AC:* NLU recognizes exit/cancel intents; LangGraph transitions to `exit_node` or a specific cancellation handler; Session state in Redis might be cleared or marked as completed/cancelled; Chatbot provides a concluding message. Langfuse trace is finalized.

*   **4.2. User Interaction Workflows (Conversational):**

    *   **Workflow 1: Booking for Self (Happy Path)**
        1.  User (logged in): "Hi, I need to make an appointment."
        2.  *Chatbot (Intent Recognized)*: "Okay, I can help with that! Who is this appointment for? Options: Myself, Jane Doe (Child)."
        3.  User: "Myself"
        4.  *Chatbot*: "Got it. And what's the reason for your visit today?"
        5.  User: "Annual check-up"
        6.  *Chatbot*: "Thanks. Which clinic location do you prefer?"
        7.  User: "Main Campus"
        8.  *Chatbot*: "And do you need a specific specialty, or is this for General Practice?"
        9.  User: "General Practice"
        10. *Chatbot*: "Do you have a preferred doctor, or is any available GP okay?"
        11. User: "Any available is fine."
        12. *Chatbot*: "Okay, let me check availability for a General Practitioner at Main Campus... Found some spots for tomorrow, May 24th: 1:00 PM, 1:30 PM, 2:15 PM. Do any of these work?"
        13. User: "1:30 PM please"
        14. *Chatbot*: "Great, 1:30 PM tomorrow it is. Just to confirm: Appointment for Yourself (John Smith) for an 'Annual check-up' with any available GP at Main Campus tomorrow, May 24th at 1:30 PM. Correct?"
        15. User: "Yes"
        16. *Chatbot*: "Booking that for you now... All set! Your appointment is confirmed with Dr. Davis (GP) at Main Campus tomorrow, May 24th at 1:30 PM. Confirmation ID: BK-67890. Anything else?"
        17. User: "No, thanks!"
        18. *Chatbot*: "You're welcome! Have a great day." (Session ends)

    *   **Workflow 2: Booking for Child (Known Info)**
        1.  User: "Book appointment for Jane"
        2.  *Chatbot*: "Sure. To confirm, is this for Jane Doe (Child)? Options: Myself, Jane Doe (Child)."
        3.  User: "Yes, Jane Doe"
        4.  *Chatbot*: "Okay, booking for Jane Doe. What's the reason for the appointment?"
        5.  User: "She has a cough"
        6.  *Chatbot*: "Okay. Which location and specialty?"
        7.  User: "Pediatrics at the West Clinic"
        8.  *Chatbot*: "Checking for Pediatricians at West Clinic... Found openings with Dr. Lee on Monday at 10:00 AM and 11:30 AM. Which time is better?"
        9.  User: "10 AM"
        10. *Chatbot*: "Got it. Confirming: Appointment for Jane Doe (Child) for 'cough' with Dr. Lee (Pediatrics) at West Clinic on Monday, May 27th at 10:00 AM. Is this correct?"
        11. User: "Correct"
        12. *Chatbot*: "Booking... Confirmed! Appointment ID: BK-11223. Anything else I can help with?"
        13. User: "Nope"

    *   **Workflow 3: Handling Slot Conflict**
        1.  ... (User selects "3:00 PM") ...
        2.  *Chatbot*: "Okay, 3:00 PM. Just to confirm: [Summary details]... Correct?"
        3.  User: "Yes"
        4.  *Chatbot*: "Booking that now... Oh, it looks like that 3:00 PM slot was just taken while we were chatting. Sorry about that! The next available times are 3:45 PM or 4:15 PM. Would either of those work instead?"
        5.  User: "Let's do 3:45 PM"
        6.  *Chatbot*: "Okay, selecting 3:45 PM... Confirming: [Updated Summary]... Correct?"
        7.  User: "Yes"
        8.  *Chatbot*: "Booking... All set! [Confirmation details for 3:45 PM]"

    *   **Workflow 4: Handling Ambiguity/Correction**
        1.  *Chatbot*: "Which specialty do you need?"
        2.  User: "Heart doctor"
        3.  *Chatbot*: "Okay, Cardiology. And which location?"
        4.  User: "Main Campus"
        5.  *Chatbot*: "Checking for Cardiology at Main Campus... Available slots..."
        6.  User: "Wait, I meant *Neurology*, not Cardiology."
        7.  *Chatbot*: "My mistake, thanks for clarifying! Let me check for *Neurology* at Main Campus instead... Found openings..." (Process continues with corrected specialty)

**5. Functional Requirements (Chat-Based)**

*   **FR1. Chat Interface:**
    *   FR1.1: Provide a chat UI within the ABC Hospital Network app for users to interact with Chatbook.
    *   FR1.2: Handle user input (text) and display chatbot responses (text, potentially interactive elements like buttons for options).
*   **FR2. Intent Recognition & Routing:**
    *   FR2.1: Implement Semantic Router/Intent Classifier to detect "book appointment" intent (See Section 3).
    *   FR2.2: Route recognized booking intents to the LangGraph booking flow. Handle other intents appropriately.
*   **FR3. Conversational Flow (LangGraph):**
    *   FR3.1: Implement LangGraph state machine (`BookingState`) to manage the booking conversation logic (nodes for patient selection, reason, preferences, availability check, slot selection, summary, confirmation, exit).
    *   FR3.2: Nodes utilize LLM calls (via Langchain `ChatOpenAI` or similar) for NLU, entity extraction, and response generation.
    *   FR3.3: Implement logic for simplified patient selection using pre-fetched authorized family members.
    *   FR3.4: Nodes interact with backend API wrappers (`main.py`) to fetch availability (`GET /bookings/slots`) and submit bookings (`POST /bookings`).
    *   FR3.5: Handle conversational error recovery (misunderstandings, API errors, booking conflicts).
*   **FR4. Natural Language Understanding (NLU):**
    *   FR4.1: Extract key entities from user messages: Patient details (if needed), Reason, Location, Specialty, Doctor Preference, Time Slot Selection, Confirmation (Yes/No), Corrections.
    *   FR4.2: Use Pydantic models for structuring and validating extracted data before using it in API calls or state updates.
*   **FR5. Backend API Interaction:**
    *   FR5.1: LangGraph nodes make secure calls to the FastAPI wrapper endpoints defined in `main.py` (e.g., `GET /bookings/slots`, `POST /bookings`, potentially `GET /users/{user_id}` to fetch initial context/family).
    *   FR5.2: Handle API responses (success, errors like 404, 409, 500) within the LangGraph flow and translate them into appropriate conversational responses.
*   **FR6. Session Management & State:**
    *   FR6.1: Utilize Redis (`redis_client.py`) to store and retrieve chat session state, including the current `BookingState` managed by LangGraph, linked to the ABC User ID.
    *   FR6.2: Implement session loading at the start (`start_node`) and saving/updating state throughout the conversation (potentially in `exit_node` or after significant steps).
    *   FR6.3: Set appropriate Redis TTL for session persistence (e.g., 1 hour).
*   **FR7. Observability (Langfuse):**
    *   FR7.1: Integrate Langfuse tracing into the LangGraph nodes.
    *   FR7.2: Create traces per chat session, linked to the ABC User ID.
    *   FR7.3: Create spans for key steps: intent recognition, each LangGraph node execution, LLM calls (with prompts/responses), API calls (with request/response data), state changes, errors.
    *   FR7.4: Tag traces/spans appropriately (e.g., `chatbook`, `booking`, `patient_selection`, `llm_call`, `api_call`).
*   **FR8. Integration with ABC Hospital Network App:**
    *   FR8.1: Securely receive ABC user context (UserID, Name, DOB, Family Member List) upon chat initiation.
    *   FR8.2: Protect backend Chatbook APIs using ABC's authentication/authorization.
    *   FR8.3: Ensure Chat UI styling aligns with ABC app guidelines.

**6. Non-Functional Requirements (NFRs)**

*   **6.1. Performance:**
    *   Chatbot response time (p95): < 3 seconds for simple turns, < 5-7 seconds for turns involving API calls or complex LLM generation.
    *   API call latency (FastAPI wrapper to Cal.com, p95): < 500ms.
    *   NLU/Entity Extraction Latency (LLM component): Acceptable latency as per chosen model and user experience goals.
*   **6.2. Security:**
    *   HTTPS for all communications.
    *   Secure handling of ABC user context.
    *   API endpoints protected by ABC auth.
    *   Input sanitization/validation before processing by LLM or APIs.
    *   Secure connection to Redis.
    *   Secure handling of API keys (Cal.com, LLM provider, Langfuse) via environment variables/secrets management (`.env`).
*   **6.3. Reliability:**
    *   Graceful handling of LLM errors, API errors, Redis unavailability.
    *   High availability for the Chatbook service.
    *   LangGraph state resilience (session restore via Redis).
*   **6.4. Scalability:** The backend service (FastAPI, LangGraph) should be scalable to handle concurrent chat sessions based on expected user load.
*   **6.5. Maintainability:**
    *   Clean, well-documented Python code (FastAPI, Langchain/LangGraph).
    *   Modular design of LangGraph nodes.
    *   Clear separation of concerns (API interaction, conversational logic, state management).
    *   Use of Pydantic for clear data contracts.
*   **6.6. Observability:** Comprehensive tracing and logging via Langfuse are critical for monitoring, debugging, and improving the conversational experience.
*   **6.7. Accessibility:** Chat interface elements should aim for WCAG 2.1 AA compliance.
*   **6.8. Compatibility:** Chat feature must function correctly within the target ABC Hospital Network application platforms (web, mobile web).

**7. Design & UX Considerations (Conversational)**

*   **7.1. Conversational Flow:** Design for natural, efficient dialogue. Avoid overly rigid scripts. Allow for user corrections and clarifications.
*   **7.2. Bot Persona:** Define a helpful, clear, and concise persona consistent with the ABC Hospital Network brand.
*   **7.3. Clarity & Brevity:** Use clear language. Keep bot messages concise. Clearly present choices and information (like available slots).
*   **7.4. Feedback:** Provide immediate feedback for user actions (e.g., "Got it," "Okay, checking..."). Confirm extracted information explicitly before proceeding.
*   **7.5. Error Handling:** Design user-friendly error messages. Guide users on how to recover or proceed when errors occur (e.g., API failure, booking conflict, NLU misunderstanding).
*   **7.6. Handling Ambiguity:** Design strategies for when user input is unclear (e.g., ask clarifying questions, offer options).
*   **7.7. Use of Interactive Elements:** Where feasible in the chat UI, use buttons or lists for presenting options (patient selection, slots, yes/no confirmation) to reduce typing and ambiguity.

**8. API Specifications**

*   **8.1. Chat Interaction Endpoint:**
    *   `POST /chat/message`
        *   **Request:** User message, session ID/user context (via headers/body/token).
        *   **Response:** Chatbot's reply message(s).
        *   **Action:** Triggers intent recognition or processes message through the active LangGraph session, updates Redis state, interacts with internal APIs as needed.
*   **8.2. Internal APIs (FastAPI Wrapper - `main.py`):**
    *   `GET /users/{user_id}`: (Potentially needed by chat backend) Fetches user details and associated family members. Requires ABC auth.
    *   `GET /bookings/slots`: (Called by LangGraph node) Fetches available slots from Cal.com. Requires API key param. Params: `startTime`, `endTime`, `eventTypeId`/`eventTypeSlug`/`usernameList`, etc.
    *   `POST /bookings`: (Called by LangGraph node) Creates a booking via Cal.com. Requires API key param. Payload includes booking details derived from `BookingState`.
    *   `GET /session`: (Potentially called by chat backend on initiation) Retrieves existing Redis session state.
    *   `POST /update-booking-form`: (May be replaced by direct Redis updates from LangGraph) Saves state to Redis.
    *   *(Other Cal.com wrapper endpoints from `main.py` as needed by the conversational flow)*.
*   **8.3. External APIs (Called by Backend):**
    *   Cal.com API (via FastAPI wrapper)
    *   LLM Provider API (e.g., OpenAI via Langchain)
    *   Langfuse API

**9. Data Models**

*   **9.1. LangGraph State (`BookingState` - Managed in memory, persisted to Redis):**
    ```python
    # Example - Needs refinement based on langchain_bot.py structure
    class BookingState(TypedDict):
        user_id: str
        session_id: str
        patient_name: Optional[str]
        patient_dob: Optional[str] # Store as ISO string?
        is_self_booking: Optional[bool]
        selected_family_member_id: Optional[str] # If booking for other known member
        reason: Optional[str]
        location_preference: Optional[str] # Could be specific ID or text needing resolution
        specialty_preference: Optional[str] # Could be specific ID or text
        doctor_preference: Optional[str] # Name, ID, or "any"
        event_type_id: Optional[int] # Resolved from preferences
        cal_user_ids_or_slugs: Optional[List[str]] # Resolved from preferences
        available_slots_raw: Optional[List[Dict]] # Raw slots from API
        presented_slots_text: Optional[str] # How slots were shown to user
        selected_slot: Optional[Dict] # The specific chosen slot dict/timestamp
        confirmation_details: Optional[Dict] # Details from successful booking response
        last_bot_message: Optional[str]
        error_message: Optional[str] # If an error occurred
        # Potentially add chat history snippet
    ```
*   **9.2. Redis Session Data:**
    *   Key: `session:chatbook:{abc_user_id}`
    *   Value: JSON serialization of the current `BookingState` or relevant session context.
*   **9.3. Pydantic Models (`models.py`):** Utilized for:
    *   Validating incoming requests to FastAPI endpoints.
    *   Validating responses from Cal.com API calls.
    *   Structuring data extracted by NLU before updating `BookingState`.
    *   Defining request bodies for internal API calls (e.g., `Booking` model structure for `POST /bookings`).
    *   Models like `User`, `Booking`, `Attendee`, `EventType`, `Schedule`, `UserCreateRequest`, `UserUpdateRequest`, `LoginRequest`, etc., are relevant for interacting with the Cal.com wrapper APIs.

**10. Technical Stack**

*   **Backend Framework:** FastAPI (Python)
*   **Conversational AI/Orchestration:** Langchain, LangGraph (Python)
*   **Natural Language Understanding/Generation:** LLM (e.g., OpenAI GPT-3.5/4 via Langchain `ChatOpenAI`)
*   **Intent Recognition:** Semantic Router (Langchain) or custom classifier
*   **Data Validation/Modeling:** Pydantic
*   **Session State:** Redis (Upstash or self-hosted, accessed via `redis-py` or `upstash-redis`)
*   **Observability/Tracing:** Langfuse (`langfuse` Python SDK)
*   **API Communication (Internal/Cal.com):** `requests` or `httpx` (as used in `main.py`)
*   **Deployment:** Containerized (Docker), served with `uvicorn`.
*   **Environment Management:** `python-dotenv`
*   **Authentication:** Leverages ABC Hospital Network's existing authentication mechanism (details TBD, likely JWT passed in headers). `PyJWT` might be used for decoding on the backend if needed.

**11. Release Criteria**

*   All User Stories implemented and pass ACs.
*   Chat-based booking flow fully functional using mock data (or specified Cal.com setup).
*   Intent recognition accurately triggers the booking flow.
*   NLU correctly extracts required entities conversationally.
*   Simplified patient selection (Self/Family) works as specified.
*   Interaction with backend APIs (availability, booking, conflict handling) functions correctly from chat flow.
*   Session state persistence and resumption via Redis are reliable.
*   Langfuse integration provides comprehensive tracing of chat sessions, LLM calls, and API interactions.
*   Integration points (auth, context, UI) with ABC Hospital Network app are functional.
*   NFRs (performance, security, reliability) met. No critical/high bugs. Code reviewed.

**12. Future Considerations**

*   Integration with real EMR/Scheduling systems (beyond Cal.com).
*   Handling real PHI (requires HIPAA compliance review).
*   More sophisticated dialogue management (handling complex digressions, multi-intent messages).
*   searching for doctor
*   Proactive suggestions (e.g., "You're due for a check-up, want to book?").
*   Multilingual support.
*   Appointment management via chat (reschedule, cancel, view upcoming).
*   Notifications/Reminders integration.

**13. Open Issues / Questions**

*   **OQ1:** Final confirmation of the *exact technical mechanism* for passing the authenticated ABC user's context (UserID, Name, DOB, authorized family members list) to the Chatbook backend APIs.
*   **OQ2:** Specific mapping between user-friendly location/specialty/doctor names mentioned in chat and the IDs/slugs required by the Cal.com API. How is this resolved? (Needs configuration or another API lookup).
*   **OQ3:** Final decision on the specific LLM to be used (e.g., OpenAI model, Azure OpenAI endpoint) and associated API keys/access.
*   **OQ4:** Detailed conversational design for error handling scenarios (API down, LLM unavailable, persistent NLU failures).
*   **OQ5:** Strategy for handling cases where a user provides multiple pieces of information in one message (e.g., "Book for Jane for her cough at Main Campus").
*   **OQ6:** Agreed-upon Redis instance details (URL, credentials) and security configuration.
*   **OQ7:** Confirmation of ABC application's chat UI capabilities (e.g., support for buttons, lists).

---
