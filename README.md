# chatbook

## Product Requirements Document (PRD): HealthConnect (Phase 1 - Integrated Form for Apollo Health)

**Version:** 1.2 (Apollo Health Integration, Phase 1 Focus)
**Author:** Kshitij
**Status:** Draft 

**1. Introduction**

*   **1.1. Purpose:** This document outlines the product requirements for **Phase 1** of HealthConnect, a feature integrated within the existing **Apollo Health** customer application (web/mobile). This phase focuses on implementing a **form-based interface** for scheduling medical appointments using mock doctor/availability data. It aims to streamline the booking process for Apollo Health users by leveraging existing user information where available and providing a clear, structured way to book appointments, including for dependents or others.
*   **1.2. Project Vision:** To provide Apollo Health users with a seamless, integrated, and efficient way to schedule medical appointments directly within their existing trusted application environment, starting with a robust form-based system and establishing a foundation for future enhancements like conversational AI powered by Azure OpenAI.
*   **1.3. Problem Statement:** Scheduling appointments through various channels can be disjointed. Apollo Health users may benefit from a dedicated, in-app feature that simplifies booking by pre-filling known data and offering a clear workflow, especially when managing appointments for family members. This phase addresses that need with a structured form.
*   **1.4. Target Audience:**
    *   **Primary:** Existing registered users of the **Apollo Health** application seeking to book medical appointments for themselves or others (e.g., children, parents) using the app.
*   **1.5. Scope Overview:** This PRD covers **Phase 1: Form-Based Integrated Booking**. It focuses on delivering a functional form within the Apollo Health app for booking appointments using mock data, handling pre-filled user data, allowing booking for others, and using Redis for temporary session/form state management. **Phase 2 (Conversational AI Interface using Azure OpenAI)** is planned as a future enhancement.

**2. Goals & Objectives (Phase 1)**

*   **2.1. Product Goals:**
    *   Successfully integrate a user-friendly appointment booking form into the existing Apollo Health application.
    *   Reduce user effort by pre-filling known user information where appropriate.
    *   Provide a clear and intuitive workflow for users booking appointments for themselves or others.
    *   Establish a reliable backend mechanism (using Redis for session state) to manage the booking process temporarily.
    *   Create a foundation for future scheduling enhancements (Phase 2).
*   **2.2. Business Objectives (Phase 1):**
    *   Launch the form-based booking feature within the Apollo Health app.
    *   Improve user satisfaction with the in-app appointment scheduling process.
    *   Validate the usability and workflow of the integrated form with user testing.
    *   Ensure seamless data flow (contextual user info) from the main Apollo Health app to the HealthConnect feature.
*   **2.3. Success Metrics (Phase 1):**
    *   **Task Completion Rate:** >95% of users successfully complete the booking form (up to confirmation stage) in usability tests.
    *   **Form Completion Time:** Average time from initiating booking to reaching the confirmation screen (Target: < 2 minutes for users booking for self with pre-filled data).
    *   **Error Rate:** < 3% of form submissions result in validation errors requiring significant correction.
    *   **User Satisfaction (Qualitative):** Positive feedback during usability testing regarding ease of use, clarity of the "booking for others" option, and appreciation for pre-filled data. Measured via surveys or direct feedback.
    *   **Feature Adoption Rate:** Percentage of active Apollo Health users utilizing the new booking feature within the first 3 months post-launch (requires analytics hooks).

**3. User Stories & Interaction Workflows (Phase 1 - Form Based)**

*   **3.1. Expanded User Stories:**
    *   **US1.1 (Initiation & Context):** As a logged-in Apollo Health app user, when I click the "Book Appointment" button/link (located in [Specify Location, e.g., main dashboard, navigation menu]), I want the system to securely receive my User ID and preferably my Name and Date of Birth, so the booking feature starts with my context.
        *   *AC:* Feature initializes upon entry; User context (UserID required, Name/DOB preferred) is received from the host app; A unique session is created/retrieved linked to the UserID.
    *   **US1.2 (Patient Selection):** As a user starting the booking, I want to be immediately presented with a clear, mandatory choice: "Who is this appointment for?" with options like "Myself" and "Someone Else" (e.g., Child, Parent, Other), so I can direct the workflow correctly from the start.
        *   *AC:* Radio buttons or equivalent prominent control displayed; Selection is mandatory to proceed; Default selection might be "Myself".
    *   **US1.3 (Booking for Self - Pre-fill):** As a user who selected "Myself", I want my Name and Date of Birth to be visibly pre-filled in the patient information section of the form, using the data from my Apollo Health profile, so I only need to verify it.
        *   *AC:* Patient Name and DOB fields are populated and potentially marked as read-only or clearly indicated as pre-filled; An "Edit" option might exist if profiles can be outdated.
    *   **US1.4 (Booking for Other - Blank Fields):** As a user who selected "Someone Else", I want the Patient Name and Date of Birth fields to be blank and clearly marked as required, so I can accurately enter the details of the person I'm booking for.
        *   *AC:* Patient Name and DOB input fields are empty; Labels clearly indicate they are required; Input validation is active for these fields.
    *   **US1.5 (Booking for Other - Relationship):** As a user booking for "Someone Else", I want a field (e.g., dropdown) to specify my relationship to the patient (e.g., Child, Parent, Spouse, Guardian, Other specified), so the clinic has context (optional but helpful).
        *   *AC:* A "Relationship to Patient" dropdown/input field is present *only* if "Someone Else" is selected; Field is optional unless "Other" requires specification; Selected value stored in session.
    *   **US1.6 (Reason for Appointment):** As a user, regardless of who the appointment is for, I need to provide a brief "Reason for Appointment" in a dedicated text field/area, so the clinical staff can prepare accordingly.
        *   *AC:* A required text input/textarea field is present; Input is validated for non-empty value; Value stored in session.
    *   **US1.7 (Appointment Preferences):** As a user, I want to use intuitive form controls (like dropdowns or searchable inputs) to select my preferred Location, required Specialty, and optionally a specific Doctor (from a list filtered by Location/Specialty), based on available mock options, so the system can find relevant slots.
        *   *AC:* Dropdowns/inputs provided for Location, Specialty (required), Doctor (optional, perhaps with an "Any Available" option); Selecting Specialty/Location dynamically filters the Doctor list; Selections stored in session.
    *   **US1.8 (Viewing Availability):** As a user, after selecting my preferences, I want to see the available mock appointment slots clearly displayed, potentially grouped by date or in a simple calendar view, with loading indicators shown while fetching, so I can easily find a suitable time.
        *   *AC:* Call to `GET /api/doctor-availability` triggered upon completing preference fields; Loading indicator shown; Results displayed in a user-friendly format (e.g., list: "Mon, Nov 6: 9:00 AM, 9:30 AM...") ; Clear message shown if no slots match criteria ("No available slots found. Please adjust your preferences or try different dates.").
    *   **US1.9 (Selecting a Slot):** As a user viewing the available slots, I want to be able to click on a specific time slot to select it, see clear visual confirmation of my selection (e.g., highlighting), and have the option to easily de-select it or choose a different one.
        *   *AC:* Time slots are interactive elements (buttons/links); Clicking selects a slot and updates temporary state; Selected slot is visually distinct; Clicking again or clicking another slot updates the selection.
    *   **US1.10 (Reviewing Summary):** As a user, before finalizing, I want a dedicated summary screen or section that clearly lists *all* key details: Who the appointment is for, Patient Name & DOB, Reason, Selected Location, Specialty, Doctor (if chosen), and the selected Date & Time, so I can perform a final check for accuracy. I also want an easy way to go back and edit information if needed.
        *   *AC:* Summary view displays all relevant `BookingData` fields; Data is read-only in this view; Clear "Edit" links/buttons associated with sections allow navigation back to the relevant form part.
    *   **US1.11 (Confirming Booking):** As a user viewing the correct summary, I want to click a clearly labeled "Confirm Booking" button to submit my request for the mock appointment.
        *   *AC:* A prominent "Confirm Booking" button exists on the summary view; Button is enabled only when a slot is selected and required fields are valid; Clicking triggers `POST /api/book-appointment`.
    *   **US1.12 (Confirmation Message):** As a user, immediately after successfully confirming, I want to see a clear confirmation message on the screen, including the mock appointment details (Patient, Doctor, Date/Time, Location) and a unique (mock) Confirmation ID, so I have assurance the booking was processed.
        *   *AC:* Success view/message replaces the form/summary; Displays key appointment details and `appointmentId` received from the API; May include next steps or links back to the main Apollo Health app.
    *   **US1.13 (Input Validation):** As a user interacting with the form, if I miss a required field or enter data in an invalid format (e.g., incorrect DOB format), I want immediate, inline validation feedback near the field upon losing focus or attempting to proceed, so I can correct errors easily without submitting the entire form.
        *   *AC:* Validation rules applied per field (required, date format, etc.); Error messages displayed clearly near the corresponding field; Proceed/Submit button might be disabled until core requirements are met.
    *   **US1.14 (Session Restoration):** As a user filling out the multi-step form, if I get interrupted (e.g., close tab, app crashes briefly) and return to the booking feature within a reasonable time (e.g., 1 hour), I want the form to automatically repopulate with the data I had already entered, so I can seamlessly continue where I left off.
        *   *AC:* Form state periodically saved to Redis session via API; Upon re-entry within TTL, `GET /api/session` retrieves last saved state; Form fields are repopulated automatically.
    *   **US1.15 (Integration Definition):** As a developer on the Apollo Health app team, I need a clear specification of how to securely pass the logged-in user's context (UserID, Name, DOB) to the HealthConnect backend when initiating the booking feature.
        *   *AC:* Technical documentation defines the API contract (e.g., expected headers like `Authorization: Bearer <token>`, required claims in the token, or initial POST body).
    *   **US1.16 (Dynamic Slot Refresh):** As a user, if I have selected preferences and viewed available slots, but then change a preference (e.g., switch to a different Location), I want the list of available slots to automatically update to reflect the new criteria without needing to manually trigger a refresh.
        *   *AC:* Changing Location, Specialty, or Doctor preference fields triggers a new call to `GET /api/doctor-availability`; Slot display updates dynamically with new results (or 'no slots' message).
    *   **US1.17 (Slot Conflict Handling):** As a user about to confirm my booking, if the specific time slot I selected was taken moments before my confirmation (simulated backend conflict), I want the system to prevent the booking and display a specific, user-friendly message on the summary screen (e.g., "Sorry, the selected time slot at [Time] on [Date] just became unavailable. Please go back and select a different time.") rather than showing a generic error.
        *   *AC:* `POST /api/book-appointment` returns a specific error code (e.g., 409 Conflict) if slot is unavailable; Frontend maps this code to a user-friendly message; User is guided back to the slot selection step.
    *   **US1.18 (Exiting the Feature):** As a user, after successfully booking an appointment or deciding to abandon the process, I want clear options (e.g., "Done", "Back to Dashboard" button, standard app navigation) to easily return to the main area of the Apollo Health application.
        *   *AC:* Clear exit path provided on confirmation screen; Cancel/Back options available throughout the flow integrate with Apollo App navigation patterns.

*   **3.2. User Interaction Workflows:**

    *   **Workflow 1: Booking for Self (Happy Path)**
        1.  User logs into Apollo Health App.
        2.  User navigates to and clicks "Book Appointment".
        3.  HealthConnect module loads. User context (ID, Name, DOB) is passed.
        4.  User sees "Who is this appointment for?". User selects "Myself".
        5.  Patient Info section appears, pre-filled with User's Name and DOB. User verifies.
        6.  User enters "Reason for Appointment".
        7.  User selects desired Location and Specialty using dropdowns.
        8.  (Optional) User selects a specific Doctor from the filtered list, or leaves as "Any Available".
        9.  Loading indicator appears briefly.
        10. Available time slots for the criteria are displayed (e.g., list grouped by date).
        11. User clicks on a desired time slot (e.g., "10:30 AM"). The slot is highlighted.
        12. User clicks "Next" or scrolls to the Summary section.
        13. Summary screen shows all details: Patient=Self (Name, DOB), Reason, Location, Specialty, Doctor, selected Date & Time.
        14. User verifies details and clicks "Confirm Booking".
        15. Brief processing indicator.
        16. Confirmation screen appears: "Appointment Confirmed!" with details and Mock Confirmation ID.
        17. User clicks "Done" or navigates back to the Apollo Health dashboard.

    *   **Workflow 2: Booking for Someone Else (Happy Path)**
        1.  User logs into Apollo Health App.
        2.  User navigates to and clicks "Book Appointment".
        3.  HealthConnect module loads. User context (ID) is passed.
        4.  User sees "Who is this appointment for?". User selects "Someone Else".
        5.  Patient Info section appears with *blank*, required fields for Name and DOB.
        6.  User enters the Patient's Name and Date of Birth.
        7.  (Optional) User selects Relationship ("Child").
        8.  User enters "Reason for Appointment".
        9.  User selects desired Location and Specialty.
        10. (Optional) User selects a specific Doctor.
        11. Available time slots are displayed.
        12. User clicks on a desired time slot.
        13. User proceeds to Summary screen.
        14. Summary screen shows all details: Patient=Someone Else (Entered Name, DOB, Relationship), Reason, Location, Specialty, Doctor, selected Date & Time.
        15. User verifies details and clicks "Confirm Booking".
        16. Confirmation screen appears with details and Mock Confirmation ID.
        17. User clicks "Done" or navigates back.

    *   **Workflow 3: Handling "No Availability"**
        1.  User enters preferences (Location, Specialty, Doctor).
        2.  Slot display area shows a message: "No available slots match your criteria. Please try adjusting location, doctor, specialty, or desired date range (if applicable)."
        3.  User changes Location preference to a different clinic.
        4.  Slot display automatically refreshes (shows loading indicator).
        5.  New available slots for the updated criteria are displayed.
        6.  User proceeds to select a slot.

    *   **Workflow 4: Handling Validation Errors**
        1.  User is booking for "Someone Else".
        2.  User fills in Name but forgets to enter Date of Birth.
        3.  User tries to click "Next" or move to the next section.
        4.  The Date of Birth field is highlighted (e.g., red border) and an inline message appears: "Date of Birth is required."
        5.  User enters the Date of Birth. The error message disappears.
        6.  User proceeds.

    *   **Workflow 5: Session Restore**
        1.  User starts booking for self, enters Reason, selects Preferences.
        2.  User views available slots but gets interrupted and closes the Apollo Health app/browser tab. (Form state was saved to Redis session in the background).
        3.  User reopens the Apollo Health app within 1 hour and navigates back to "Book Appointment".
        4.  The system recognizes the active session for the user ID.
        5.  The booking form loads, automatically repopulated with the previously selected "Self", pre-filled Name/DOB, entered Reason, and selected Preferences. The available slots section might need reloading or show the previously fetched slots.
        6.  User continues the process from selecting a time slot.

    *   **Workflow 6: Slot Conflict on Confirmation**
        1.  User has selected a slot ("11:00 AM") and reviewed the summary.
        2.  User clicks "Confirm Booking".
        3.  The backend API (`POST /api/book-appointment`) checks the mock availability and finds the 11:00 AM slot is now marked `isAvailable: false` (simulated conflict).
        4.  The API returns a 409 Conflict error.
        5.  The frontend displays a message on the summary screen: "Sorry, the selected time slot (11:00 AM on [Date]) is no longer available. Please select a different time."
        6.  The "Confirm Booking" button might be disabled. A "Choose a Different Time" button/link appears.
        7.  User clicks the link and is taken back to the slot selection view with updated availability.

**4. Functional Requirements (Phase 1)**

*   **4.1. User Interface (Form-Based):**
    *   **FR1.1:** Implement UI within Apollo Health app framework.
    *   **FR1.2:** Implement Patient Identification (Self/Other) choice. Handle pre-fill for Self, require input for Other. Include optional Relationship field.
    *   **FR1.3:** Required fields: Patient Name, DOB (if Other), Reason.
    *   **FR1.4:** Preference fields: Location, Specialty (req), Doctor (opt). Implement dynamic filtering.
    *   **FR1.5:** Availability Display: Fetch via API, show loading state, display slots clearly, handle "no slots" message. Implement dynamic refresh on preference change (US1.16).
    *   **FR1.6:** Slot Selection: Interactive slots, clear visual indication of selection, allow de-selection.
    *   **FR1.7:** Summary View: Display all key data, provide "Edit" links.
    *   **FR1.8:** Booking Confirmation View: Display success message, mock details, mock ID. Include clear exit navigation (US1.18).
    *   **FR1.9:** Input Validation: Implement client/server-side validation. Inline error messages (US1.13).
*   **4.2. Appointment Management (Mock Data):**
    *   **FR2.1:** Implement `GET /api/doctor-availability` (mock data).
    *   **FR2.2:** Implement `POST /api/book-appointment` (mock data). Include logic to *simulate* slot conflict possibility and return 409 error code if triggered (US1.17).
    *   **FR2.3:** Define mock Doctor/TimeSlot data.
*   **4.3. Session Management & State:**
    *   **FR3.1:** Implement `GET /api/session` to handle Apollo user context, create/retrieve Redis session linked to Apollo User ID. Enable session restore (US1.14).
    *   **FR3.2:** Implement API (`POST /api/update-booking-form`) for incremental form state saving to Redis.
    *   **FR3.3:** Use Upstash Redis securely.
    *   **FR3.4:** Use Redis keys like `session:apollo:<apolloUserId>`.
    *   **FR3.5:** Set session TTL (e.g., 1 hour inactivity).
    *   **FR3.6:** Handle Redis errors gracefully.
*   **4.4. Integration with Apollo Health App:**
    *   **FR4.1:** Implement defined mechanism for receiving Apollo user context securely (US1.15).
    *   **FR4.2:** Protect API endpoints using Apollo Health's authentication/authorization system.
    *   **FR4.3:** Ensure UI styling aligns with Apollo Health app guidelines.
    *   **FR4.4:** Implement clear entry and exit navigation points integrating with the Apollo Health app structure (US1.1, US1.18).
*   **4.5. PWA Capabilities (Compatibility):**
    *   **FR5.1:** Ensure the integrated feature works correctly within the Apollo Health app if it's a PWA or web app. Avoid breaking existing service workers or manifest configurations.

**5. Non-Functional Requirements (NFRs)**

*   *(Largely similar to previous version, updated references)*
*   **5.1. Performance:** Form load < 1s, API calls < 300-500ms (p95).
*   **5.2. Security:** HTTPS, secure handling of Apollo user context, API protection via Apollo auth, input validation, secure Redis connection. Adhere to Apollo Health security standards.
*   **5.3. Reliability:** Graceful API/Redis error handling, session restore.
*   **5.4. Accessibility:** WCAG 2.1 AA target for the form.
*   **5.5. Compatibility:** Support Apollo Health app's target platforms/browsers/screen sizes.
*   **5.6. Maintainability:** Code quality per Apollo Health standards, TypeScript, comments.

**6. Design & UX Considerations**

*   *(Similar to previous version, emphasize consistency with Apollo Health)*
*   **6.1. UI:** Clean, intuitive, **consistent with Apollo Health app design language**.
*   **6.2. Flow:** Logical steps, clear self/other path, easy preference selection, seamless transitions.
*   **6.3. Feedback:** Immediate visual feedback for actions, loading, validation, selection, confirmation.
*   **6.4. Pre-fill Indication:** Clear visual cues for pre-filled data.

**7. API Specifications (Phase 1 - Apollo Health Context)**

*   *(Updated references, emphasizing Apollo auth)*
*   **7.1. `GET /api/session`**: Requires Apollo auth context. Returns session linked to `apolloUserId`.
*   **7.2. `POST /api/update-booking-form`**: Requires Apollo session. Saves partial `BookingData`.
*   **7.3. `POST /api/book-appointment`**: Requires Apollo session. Validates `BookingData`, simulates booking, handles conflicts (409).
*   **7.4. `GET /api/doctor-availability`**: Requires Apollo auth. Filters based on query params.

**8. Data Models (Phase 1 - Apollo Health Context)**

*   **8.1. Doctor, TimeSlot:** (Unchanged - mock data)
*   **8.2. BookingData (Stored in Session):** (Unchanged from v1.1) - Contains patient details (self or other), preferences, selected slot, confirmation details.
*   **8.3. Session (Stored in Redis)**
    ```typescript
    type Session = {
      id: string // Unique session identifier (Redis key)
      apolloUserId: string // Link to the logged-in Apollo Health user
      created: number // Timestamp
      lastActive: number // Timestamp
      bookingData?: BookingData // Current state of the booking form
    }
    ```

**9. Release Criteria (Phase 1)**

*   All Phase 1 User Stories (expanded list) implemented and pass ACs.
*   Form-based booking flow fully functional within the Apollo Health app context using mock data.
*   Pre-fill, booking for others, session restore, dynamic refresh, conflict handling work as specified.
*   Integration points (auth, context, UI) with Apollo Health app are functional and approved.
*   NFRs met. No critical/high bugs. Code reviewed per Apollo Health standards.

**10. Future Considerations**

*   **Phase 2: Conversational AI Interface:** Replace the Phase 1 form with an AI chat interface. This interface will leverage **Azure OpenAI Service models** (e.g., GPT-4 via Azure) integrated via backend APIs (likely *not* using Vercel AI SDK directly if integrated deeply in existing backend). The chat interface would need to handle:
    *   Natural language understanding to extract intent and entities (patient info, preferences).
    *   Logic to check for pre-loaded Apollo user data and only ask for missing information.
    *   Explicitly asking if the booking is for self or someone else.
    *   Presenting availability and handling slot selection via conversation.
    *   Confirmation flow via chat.
    *   Utilizing the same Redis session mechanism and backend API calls for availability/booking developed in Phase 1.
*   **Phase 3 onwards:** Persistent database, real-time availability, full appointment management, notifications, calendar integration, HIPAA compliance review for real data, etc.

**11. Open Issues / Questions (Phase 1)**

*   **OQ1:** Final confirmation of the *exact technical mechanism* for passing the authenticated Apollo user's context (UserID, Name, DOB) to the HealthConnect backend APIs.
*   **OQ2:** Definitive list of required/optional fields required by Apollo Health for a mock appointment booking.
*   **OQ3:** Definitive list of mock Locations, Specialties, Doctors for Phase 1.
*   **OQ4:** Agreed-upon behavior if Redis is temporarily unavailable?
*   **OQ5:** Confirmation of the Apollo Health application's front-end stack and any specific integration constraints or required libraries.
*   **OQ6:** Specific Apollo Health styling guidelines or component library to be used/matched.
*   **OQ7 (For Phase 2 Planning):** Which specific Azure OpenAI models are approved/available for use? What are the API endpoint details and authentication mechanisms for the Azure OpenAI service within the Apollo Health infrastructure?

---

## Scope Definition Document: HealthConnect - Phase 1 (Integrated Form for Apollo Health)

**Version:** 1.2 (Apollo Health Integration, Phase 1 Focus)
**Date:** 2023-10-27
**Project Phase:** Phase 1: Form-Based Integrated Booking

**1. Project Overview & Goals (Recap)**

HealthConnect aims to enhance the **Apollo Health** application by adding integrated medical appointment scheduling. **Phase 1** focuses on implementing a **form-based booking interface** within the existing Apollo Health app. This interface will utilize **mock doctor and availability data**, leverage pre-loaded logged-in user information, allow booking for oneself or others, and use Redis for temporary session/form state management.

**Goals:** Deliver a functional, integrated booking form within the Apollo Health app, streamline the process using context, handle booking for others, establish backend session management, and prepare for Phase 2 (Conversational AI using Azure OpenAI).

**2. In Scope Features (Phase 1)**

*   **IS1: Form-Based User Interface:** Implementation within Apollo Health app, handling Self/Other booking paths, pre-filling data, required fields, preference selection, validation.
*   **IS2: Mock Appointment Backend Logic:** APIs for mock availability (`GET /api/doctor-availability`) and mock booking (`POST /api/book-appointment`, including simulated conflict handling).
*   **IS3: Session & State Management:** Redis (Upstash) for temporary form state linked to Apollo User ID, including incremental saving and session restore logic. APIs for session handling.
*   **IS4: Integration with Apollo Health Application:** Receiving user context, API protection via Apollo auth, consistent UI styling, defined navigation entry/exit points.
*   **IS5: Technical Foundation:** Development using agreed stack, implementing Phase 1 Data Models/APIs, adherence to NFRs. Dynamic slot refresh on preference change.
*   **IS6: Testing:** Unit/Integration tests covering form logic, APIs, session handling, pre-fill, booking for others, dynamic updates, conflict handling. Usability and accessibility testing.

**3. Out of Scope Features (Phase 1)**

*   **OOS1: Phase 2: Conversational AI Interface:** The entire AI chat-based booking flow using **Azure OpenAI Service models** is out of scope for Phase 1.
*   **OOS2:** User Authentication & Account Management (Handled by Apollo Health app).
*   **OOS3:** Persistent Database Integration (Beyond Redis sessions).
*   **OOS4:** Integration with Real EMR/Practice Management Systems or Real Doctor Schedules.
*   **OOS5:** Handling or Storing Real Patient Health Information (PHI) persistently.
*   **OOS6:** Payment Processing.
*   **OOS7:** Insurance Verification.
*   **OOS8:** Appointment Management (View History, Reschedule, Cancel).
*   **OOS9:** Push Notifications or Email/SMS Reminders.
*   **OOS10:** Calendar Integration (.ics files, API integration).
*   **OOS11:** Multi-language Support.
*   **OOS12:** Advanced Features (Admin Dashboards, Symptom Checkers, etc.).
*   **OOS13:** PWA-specific features *beyond* basic compatibility with the host Apollo Health app.

**4. Assumptions**

*   **A1:** The Apollo Health app can securely provide UserID, Name, DOB context. Mechanism TBD.
*   **A2:** The Apollo Health app provides the navigation entry point.
*   **A3:** Agreed mock data is sufficient.
*   **A4:** Redis (Upstash) is approved for temporary session state.
*   **A5:** Target front-end stack compatibility or alternatives identified.
*   **A6:** Access to Apollo Health dev standards and testing environment provided.
*   **A7:** Azure subscription with access to Azure OpenAI service is planned/available for *future* Phase 2 development.

**5. Constraints**

*   **C1:** Dependency on Apollo Health app (auth, context, UI).
*   **C2:** Mock data only.
*   **C3:** Data persistence limited to Redis session TTL.
*   **C4:** Reliance on Upstash Redis availability.
*   **C5:** Adherence to Apollo Health technical and security standards.
*   **C6:** Implicit budget/time constraints.
*   **C7:** (For Phase 2 Planning) Phase 2 implementation will be constrained by capabilities/limitations/costs of approved Azure OpenAI models.

**6. Deliverables (Phase 1)**

*   **D1:** Functional form-based booking module integrated within the Apollo Health application environment (staging/testing).
*   **D2:** Source code in Git repository.
*   **D3:** Code documentation (comments) and README.
*   **D4:** Test suite results.
*   **D5:** Usability and accessibility testing reports (if applicable).

**7. High-Level Acceptance Criteria (Phase 1)**

*   Apollo users can access the feature with context correctly identified.
*   Users can successfully complete booking flow for Self (with pre-fill) and Others using mock data.
*   Form state persists via Redis session during active use.
*   Integration points (auth, context, UI) work as expected within Apollo Health app.
*   Dynamic slot updates and conflict handling work as described.
*   Performance and accessibility targets met.

---
