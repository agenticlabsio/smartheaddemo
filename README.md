# chatbook
booking appointment through conversational interface
Okay, this significantly changes the context! Focusing on Phase 1 as part of an *existing* Baylor Health application, with potential pre-loaded data and the ability to book for others, requires a different approach.

Here are the revised, detailed PRD and Scope documents specifically for **Phase 1: Form-Based Integrated Booking**, keeping Phase 2 (Conversational AI) as a future roadmap item.

---

## Product Requirements Document (PRD): HealthConnect (Phase 1 - Integrated Form)

**Version:** 1.1 (Refocused on Phase 1 Integration)
**Date:** 2023-10-27
**Author:** [Your Name/Team]
**Status:** Draft / Final

**1. Introduction**

*   **1.1. Purpose:** This document outlines the product requirements for **Phase 1** of HealthConnect, a feature integrated within the existing Baylor Health customer application (web/mobile). This phase focuses on implementing a **form-based interface** for scheduling medical appointments using mock doctor/availability data. It aims to streamline the booking process by leveraging existing user information where available and providing a clear, structured way to book appointments, including for dependents or others.
*   **1.2. Project Vision:** To provide Baylor Health users with a seamless, integrated, and efficient way to schedule medical appointments directly within their existing trusted application environment, starting with a robust form-based system and paving the way for future enhancements like conversational AI.
*   **1.3. Problem Statement:** While Baylor Health provides a digital platform, the appointment scheduling process might still involve friction points. Users may need to re-enter information already known to the system or lack a clear way to book appointments for family members. This phase aims to create a dedicated, user-friendly form-based booking flow within the app that leverages existing context and simplifies the task.
*   **1.4. Target Audience:**
    *   **Primary:** Existing registered users of the Baylor Health application seeking to book medical appointments for themselves or others (e.g., children, parents) using the app.
*   **1.5. Scope Overview:** This PRD covers **Phase 1: Form-Based Integrated Booking**. It focuses on delivering a functional form within the Baylor Health app for booking appointments using mock data, handling pre-filled user data, allowing booking for others, and using Redis for temporary session/form state management. **Phase 2 (Conversational AI Interface)** is planned as a future enhancement.

**2. Goals & Objectives (Phase 1)**

*   **2.1. Product Goals:**
    *   Successfully integrate a user-friendly appointment booking form into the existing Baylor Health application.
    *   Reduce friction by pre-filling known user information where appropriate.
    *   Provide a clear workflow for users booking appointments for themselves or others.
    *   Establish a reliable backend mechanism (using Redis for session state) to manage the booking process temporarily.
    *   Create a foundation for future scheduling enhancements (like Phase 2).
*   **2.2. Business Objectives (Phase 1):**
    *   Launch the form-based booking feature within the Baylor Health app.
    *   Improve user satisfaction with the in-app appointment scheduling process.
    *   Validate the usability and workflow of the integrated form with user testing.
    *   Ensure seamless data flow (contextual user info) from the main Baylor app to the HealthConnect feature.
*   **2.3. Success Metrics (Phase 1):**
    *   **Task Completion Rate:** >95% of users successfully complete the booking form (up to confirmation stage) in usability tests.
    *   **Form Completion Time:** Average time from initiating booking to reaching the confirmation screen (Target: < 2 minutes for users booking for self with pre-filled data).
    *   **Error Rate:** < 3% of form submissions result in validation errors requiring significant correction.
    *   **User Satisfaction (Qualitative):** Positive feedback during usability testing regarding ease of use, clarity of the "booking for others" option, and appreciation for pre-filled data.
    *   **Feature Adoption:** Track usage of the new booking feature within the Baylor app (requires analytics hooks).

**3. User Stories & Use Cases (Phase 1 - Form Based)**

*   **3.1. Epic: Integrated Form-Based Appointment Booking**
    *   **US1.1:** As a logged-in Baylor Health app user, when I navigate to "Book Appointment", I want the system to identify me, so that relevant information can potentially be pre-filled.
        *   *AC:* System receives user context (e.g., User ID, Name, DOB) from the main Baylor app upon entering the feature.
    *   **US1.2:** As a user starting the booking process, I want to be asked clearly who the appointment is for ("Yourself" or "Someone Else" - e.g., Child, Parent, Other), so I can provide the correct patient details.
        *   *AC:* A clear choice (e.g., radio buttons, segmented control) is presented at the start of the form.
    *   **US1.3:** As a user booking for "Yourself", I want my known details (like Name, Date of Birth) pre-filled in the form, so I don't have to type them again.
        *   *AC:* If "Yourself" is selected, relevant form fields (Patient Name, Patient DOB) are populated using the logged-in user's context data. Fields are editable if needed.
    *   **US1.4:** As a user booking for "Someone Else", I want the patient information fields (Name, Date of Birth) to be empty, so I can enter the details of the person needing the appointment.
        *   *AC:* If "Someone Else" is selected, Patient Name and Patient DOB fields are blank and marked as required.
    *   **US1.5:** As a user booking for "Someone Else", I want an optional field to specify my relationship to the patient (e.g., Parent, Spouse, Guardian, Other), for clarity.
        *   *AC:* An optional "Relationship to Patient" field (dropdown or text input) is available when booking for someone else.
    *   **US1.6:** As a user (booking for self or other), I need to provide the Reason for Appointment, so the clinic has context.
        *   *AC:* A required text input/textarea field for "Reason for Appointment" is present.
    *   **US1.7:** As a user, I want to specify my preferences for the appointment, such as desired specialty, specific doctor (optional), and preferred location, using form controls.
        *   *AC:* Form includes elements (dropdowns, searchable inputs) to select Specialty, Doctor (filtered by specialty/location), and Location based on available mock data.
    *   **US1.8:** As a user, after specifying my preferences, I want to see a list or calendar view of available mock appointment slots, so I can choose a suitable time.
        *   *AC:* System calls `GET /api/doctor-availability` with form criteria. Results are displayed clearly (e.g., list of dates/times, simple calendar). Interface handles "no slots available" gracefully.
    *   **US1.9:** As a user, I want to select a specific time slot from the available options.
        *   *AC:* User can click/select a time slot. Selection is visually indicated. Selected `TimeSlot.id` is stored temporarily.
    *   **US1.10:** As a user, before final confirmation, I want to see a summary screen displaying all the appointment details I've entered or selected (Patient Name, DOB, Reason, Doctor, Location, Date/Time), so I can verify accuracy.
        *   *AC:* A confirmation step/section displays all key `BookingData` clearly.
    *   **US1.11:** As a user, I want to click a "Confirm Booking" button to finalize the mock appointment.
        *   *AC:* A prominent confirmation button exists. Clicking it triggers the booking API call.
    *   **US1.12:** As a user, after confirming, I want to receive a clear success message including the mock appointment details and a confirmation number.
        *   *AC:* `POST /api/book-appointment` called. On success, a confirmation view/message is displayed with Patient Name, Doctor, Location, Date/Time, and mock `appointmentId`.
    *   **US1.13:** As a user filling the form, I want validation messages if I miss required fields or enter data incorrectly (e.g., invalid date format), so I can correct them easily.
        *   *AC:* Standard form validation implemented (e.g., on blur, on submit). Clear error messages shown near relevant fields.

*   **3.2. Epic: Session Management & Integration Context**
    *   **US1.14:** As a user filling out the multi-step booking form, if I accidentally close the tab/app page and reopen it quickly (within session timeout), I want my partially filled form data to be preserved, so I don't have to start over.
        *   *AC:* Form state is saved to Redis session via API calls during form progression. Re-entering the feature within the timeout retrieves and repopulates the form state.
    *   **US1.15:** As a developer integrating this feature, I need a defined way for the main Baylor app to pass the logged-in user context to the HealthConnect backend.
        *   *AC:* Mechanism defined (e.g., secure token in API headers, initial hydration call). `GET /api/session` or similar endpoint handles receiving this context.

**4. Functional Requirements (Phase 1)**

*   **4.1. User Interface (Form-Based):**
    *   **FR1.1:** Implement a multi-step or single-page form UI using standard web components compatible with the Baylor Health app's framework (assume React/Next.js with `shadcn/ui` for consistency, unless specified otherwise).
    *   **FR1.2:** **Patient Identification:**
        *   Include a mandatory choice (e.g., Radio Buttons): "This appointment is for: [ ] Yourself [ ] Someone Else".
        *   If "Yourself" selected: Pre-fill "Patient Name" and "Patient Date of Birth" fields from the received Baylor user context. Fields should be editable.
        *   If "Someone Else" selected: "Patient Name" and "Patient Date of Birth" fields must be empty and required. Add an optional "Relationship to Patient" (e.g., dropdown: Child, Parent, Spouse, Guardian, Other).
    *   **FR1.3:** **Required Fields:** Patient Name, Patient Date of Birth, Reason for Appointment (Textarea).
    *   **FR1.4:** **Preference Fields:**
        *   Location Selection (e.g., Dropdown or searchable list based on mock data).
        *   Specialty Selection (e.g., Dropdown based on mock data).
        *   Doctor Selection (e.g., Optional, searchable list, filtered by selected specialty/location based on mock data).
    *   **FR1.5:** **Availability Display:** Fetch available slots via `GET /api/doctor-availability` based on form inputs. Display slots clearly (e.g., grouped by day, list of times). Provide clear feedback if no slots are available.
    *   **FR1.6:** **Slot Selection:** Allow users to click/select an available time slot. Visually indicate the selected slot.
    *   **FR1.7:** **Summary/Confirmation View:** Display all collected/selected data clearly before final submission.
    *   **FR1.8:** **Booking Confirmation:** Upon successful booking via `POST /api/book-appointment`, display a confirmation message with mock appointment details (Patient, Doctor, Date/Time, Location, mock `appointmentId`).
    *   **FR1.9:** **Input Validation:** Implement client-side and server-side validation for all required fields, date formats, etc. Display clear, user-friendly error messages.
*   **4.2. Appointment Management (Mock Data):**
    *   **FR2.1:** Implement `GET /api/doctor-availability` endpoint (as previously defined, using mock data).
    *   **FR2.2:** Implement `POST /api/book-appointment` endpoint:
        *   Accept `sessionId` and `selectedTimeSlotId`.
        *   Retrieve full `BookingData` from Redis session associated with `sessionId`.
        *   Validate that all required fields in `BookingData` (Patient Name, DOB, Reason, Slot ID, etc.) are present.
        *   Check mock `TimeSlot.isAvailable`.
        *   If valid and available: Simulate booking (update mock data state if possible, or just proceed), generate mock `appointmentId`, update `BookingData` in Redis, return success with `appointmentId` and confirmed details.
        *   If invalid/unavailable: Return appropriate error (400, 409, 500).
    *   **FR2.3:** Define mock data for Doctors and TimeSlots (as previously defined).
*   **4.3. Session Management & State:**
    *   **FR3.1:** Implement `GET /api/session` endpoint:
        *   Accept Baylor user context (e.g., via Auth header/token).
        *   Check for existing Redis session associated with the Baylor User ID or a session token.
        *   If exists and valid, return session data (including potentially partially filled `BookingData`).
        *   If not, create a new Redis session (linked to Baylor User ID if possible), store initial user context, and return new session info.
    *   **FR3.2:** Implement API mechanism (`POST /api/update-booking-form` or similar) to incrementally save form state to the Redis `Session.bookingData` as the user progresses through the form. This provides resilience against accidental closure.
    *   **FR3.3:** Use Upstash Redis for session storage. Configure connection securely.
    *   **FR3.4:** Use appropriate Redis keys (e.g., `session:baylor:<userID>` or `session:<sessionToken>`).
    *   **FR3.5:** Set a reasonable TTL for Redis sessions (e.g., 1 hour of inactivity for form state).
    *   **FR3.6:** Implement error handling for Redis connection issues.
*   **4.4. Integration with Baylor Health App:**
    *   **FR4.1:** Define the mechanism for receiving logged-in user context (Name, DOB, UserID) from the main Baylor app. (e.g., Assume backend APIs will receive a JWT or similar token identifying the user).
    *   **FR4.2:** Ensure API endpoints are protected and can only be accessed by authenticated Baylor users (requires coordination with Baylor app's auth system).
    *   **FR4.3:** Ensure the UI components used are stylistically compatible with the host Baylor Health application.
*   **4.5. PWA Capabilities (If Applicable):**
    *   **FR5.1:** If the host Baylor Health app is a PWA or web-based, ensure this integrated feature does not break existing PWA functionality.
    *   **FR5.2:** Core assets related to *this feature* could potentially be cached by the main app's service worker, but specific PWA implementation for this module itself might be limited/inherited. *Requirement: Ensure compatibility and avoid negative impacts on host app's PWA behaviour.*

**5. Non-Functional Requirements (NFRs)**

*   **5.1. Performance:**
    *   Form initial load time (within Baylor app) < 1 second.
    *   Availability check (`GET /api/doctor-availability`) response time < 300ms (p95).
    *   Booking confirmation (`POST /api/book-appointment`) response time < 500ms (p95).
*   **5.2. Security:**
    *   All communication via HTTPS.
    *   Secure handling of Baylor user context data received from the host app. Adhere to Baylor's security standards.
    *   Protection against common web vulnerabilities (XSS, CSRF - potentially handled by host app framework).
    *   Input validation on backend.
    *   Redis connection secured.
    *   **Note:** Still using mock appointment data, so no real PHI stored persistently. However, handling of received User Name/DOB must be secure in transit and in the temporary Redis session.
*   **5.3. Reliability:**
    *   Graceful error handling for API failures (Redis, internal logic). User-friendly messages displayed on the form.
    *   Form state preserved in session storage handles minor interruptions.
*   **5.4. Accessibility:**
    *   Target WCAG 2.1 Level AA compliance for the form interface.
    *   Full keyboard navigation, clear focus indicators, proper labeling for inputs, ARIA attributes where needed. Screen reader compatibility.
*   **5.5. Compatibility:**
    *   Must be compatible with the browser/platform versions supported by the main Baylor Health application.
    *   Responsive design for the form adapts to the container within the Baylor app across supported screen sizes.
*   **5.6. Maintainability:**
    *   Code follows Baylor Health's development standards and practices.
    *   Clear separation between UI, API logic, and integration points. Use TypeScript. Well-commented code.

**6. Design & UX Considerations**

*   **6.1. UI:** Clean, intuitive form layout. Consistent styling with the Baylor Health app.
*   **6.2. Flow:** Logical progression through form steps. Clear distinction between booking for self vs. others.
*   **6.3. Feedback:** Clear visual feedback for required fields, validation errors, loading states (fetching availability), slot selection, and final confirmation.
*   **6.4. Pre-fill Indication:** Make it clear to users when data is pre-filled (e.g., subtle background color, non-editable display with an "edit" option if needed).

**7. API Specifications (Phase 1 - Updates)**

*   **7.1. `GET /api/session`**
    *   **Auth:** Requires valid Baylor user authentication context (e.g., Authorization header with JWT).
    *   **Response:** Includes session ID and potentially pre-filled `bookingData` based on user context if a new session is created.
*   **7.2. `POST /api/update-booking-form` (Example endpoint for saving form state)**
    *   **Auth:** Requires valid Baylor session.
    *   **Request Body:** `{ sessionId: string, data: Partial<BookingData> }` (includes fields like `isBookingForSelf`, `patientName`, `patientDOB`, etc.)
    *   **Response:** Success/failure status.
*   **7.3. `POST /api/book-appointment`**
    *   **Auth:** Requires valid Baylor session.
    *   **Request Body:** `{ sessionId: string, selectedTimeSlotId: string }` (Backend retrieves full `BookingData` from Redis via `sessionId`).
    *   **Response:** Success includes mock `appointmentId` and confirmed `BookingData`. Errors for validation, conflicts, etc.
*   **7.4. `GET /api/doctor-availability`**
    *   **Auth:** Requires valid Baylor session/authentication.
    *   **Query Params:** Filters based on form input (specialty, location, doctorId, date range).

**8. Data Models (Phase 1 - Updates)**

*   **8.1. Doctor, TimeSlot:** (Remain as previously defined - mock data)
*   **8.2. BookingData (Stored in Session)**
    ```typescript
    type BookingData = {
      // Meta
      isBookingForSelf: boolean | null // Tracks user choice: true=Self, false=Other, null=Not selected yet
      relationshipToPatient?: string // Optional: "Child", "Parent", "Spouse", "Other" (only if !isBookingForSelf)

      // Patient Details (Could be self or other)
      patientName?: string
      patientDOB?: string // YYYY-MM-DD - ensure secure handling even if temporary

      // Appointment Details
      reasonForAppointment?: string
      preferredLocation?: string
      preferredSpecialty?: string
      preferredDoctorId?: string // Optional
      selectedTimeSlotId?: string // ID of the chosen TimeSlot

      // Confirmation Details (Populated after successful booking)
      appointmentId?: string // Mock ID generated on success
      confirmedDateTime?: string // ISO string or similar
      confirmedLocation?: string
      confirmedDoctorName?: string
      confirmedSpecialty?: string // Store for display confirmation
    }
    ```
*   **8.3. Session (Stored in Redis)**
    ```typescript
    type Session = {
      id: string // Unique session identifier (Redis key)
      baylorUserId: string // Link to the logged-in Baylor user
      created: number // Timestamp
      lastActive: number // Timestamp
      bookingData?: BookingData // Current state of the booking form
    }
    ```

**9. Release Criteria (Phase 1)**

*   All Phase 1 User Stories implemented and pass ACs.
*   Form-based booking flow fully functional within the Baylor app context using mock data.
*   Pre-filling of user data works correctly when booking for self.
*   Booking for others flow works correctly, capturing necessary patient details.
*   Form state persists in Redis session during active use.
*   Integration points with Baylor app (authentication, user context passing) are functional.
*   NFRs (performance, accessibility, security considerations) are met.
*   No critical/high bugs related to Phase 1 scope. Code reviewed per Baylor standards.

**10. Future Considerations**

*   **Phase 2: Conversational AI Interface:** Replace the form with an AI chat interface (leveraging Vercel AI SDK, GPT-4o), retaining the backend logic for availability/booking and session management. This would reuse the logic for handling pre-filled data and booking for others within the conversation.
*   **Phase 3 onwards:** Persistent database integration, real-time availability, appointment management, notifications, calendar integration, potential HIPAA compliance for real data, etc. (as outlined previously).

**11. Open Issues / Questions (Phase 1)**

*   **OQ1:** What is the *exact technical mechanism* for passing the authenticated Baylor user's context (UserID, Name, DOB) to the HealthConnect backend API routes? (e.g., Specific JWT claims, dedicated API call).
*   **OQ2:** What is the definitive list of required vs. optional fields for the booking form from Baylor Health's perspective?
*   **OQ3:** What is the definitive list of mock Locations, Specialties, and Doctors needed for Phase 1?
*   **OQ4:** What is the expected behavior if Redis is temporarily unavailable? (Show error message, disable form?)
*   **OQ5:** What is the host Baylor Health application's front-end framework and component library? (Confirm compatibility with `shadcn/ui` or need for adaptation).
*   **OQ6:** Are there specific styling guidelines from Baylor Health that need to be strictly adhered to?

---

## Scope Definition Document: HealthConnect - Phase 1 (Integrated Form)

**Version:** 1.1 (Refocused on Phase 1 Integration)
**Date:** 2023-10-27
**Project Phase:** Phase 1: Form-Based Integrated Booking

**1. Project Overview & Goals (Recap)**

HealthConnect aims to enhance the Baylor Health application by adding integrated medical appointment scheduling. **Phase 1** focuses on implementing a **form-based booking interface** within the existing Baylor app. This interface will utilize **mock doctor and availability data**, leverage pre-loaded logged-in user information where applicable, allow booking for oneself or others, and use Redis for temporary session/form state management.

**Goals:** Deliver a functional, integrated booking form, streamline the process using context, handle booking for others, establish backend session management, and prepare for Phase 2 (Conversational AI).

**2. In Scope Features (Phase 1)**

*   **IS1: Form-Based User Interface:**
    *   Implementation of booking form UI elements (inputs, dropdowns, date pickers, radio buttons, etc.) compatible with the Baylor app.
    *   Logic to ask if booking is for "Self" or "Someone Else".
    *   Logic to pre-fill Patient Name/DOB from Baylor user context if "Self" is selected.
    *   Required fields for Patient Name/DOB/Reason when booking for "Someone Else".
    *   Optional "Relationship to Patient" field.
    *   Form fields for Location, Specialty, Doctor preferences.
    *   Client-side and server-side form validation.
*   **IS2: Mock Appointment Backend Logic:**
    *   API endpoint (`GET /api/doctor-availability`) serving mock time slots based on form criteria.
    *   API endpoint (`POST /api/book-appointment`) to validate session data and simulate booking using mock data.
    *   Definition and use of mock `Doctor` and `TimeSlot` data.
*   **IS3: Session & State Management:**
    *   Redis (Upstash) integration for storing temporary form state (`BookingData`) within a `Session` object.
    *   API endpoints (`GET /api/session`, `POST /api/update-booking-form` or similar) for session creation, retrieval, and incremental state saving.
    *   Linking Redis session to the authenticated Baylor user context.
    *   Session timeout configuration (e.g., 1 hour inactivity).
*   **IS4: Integration with Baylor Health Application:**
    *   Mechanism to receive authenticated user context (UserID, Name, DOB) from the host Baylor app.
    *   API endpoint protection ensuring only authenticated Baylor users can access them.
    *   UI styling consistent with the Baylor Health application.
*   **IS5: Technical Foundation:**
    *   Development using agreed-upon framework (e.g., Next.js, React) and libraries (e.g., `shadcn/ui`, Tailwind CSS, adjusted based on Baylor stack).
    *   Implementation based on Phase 1 Data Models (`BookingData`, `Session`) and API specifications.
    *   Adherence to NFRs (Performance, Security, Reliability, Accessibility, Compatibility).
*   **IS6: Testing:**
    *   Unit/Integration testing for form logic, API endpoints, session handling.
    *   Testing of pre-fill and "booking for others" logic.
    *   Basic performance, usability, and accessibility testing of the form flow.

**3. Out of Scope Features (Phase 1)**

*   **OOS1: Phase 2: Conversational AI Interface:** The entire AI chat-based booking flow is out of scope for Phase 1.
*   **OOS2:** User Authentication & Account Management (Handled by the main Baylor Health application).
*   **OOS3:** Persistent Database Integration (PostgreSQL, MongoDB, etc.). All booking data is temporary (Redis session) and mock.
*   **OOS4:** Integration with Real EMR/Practice Management Systems or Real Doctor Schedules.
*   **OOS5:** Handling or Storing Real Patient Health Information (PHI) persistently.
*   **OOS6:** Payment Processing.
*   **OOS7:** Insurance Verification.
*   **OOS8:** Appointment Management (View History, Reschedule, Cancel).
*   **OOS9:** Push Notifications or Email/SMS Reminders.
*   **OOS10:** Calendar Integration (.ics files, API integration).
*   **OOS11:** Multi-language Support.
*   **OOS12:** Advanced Features (Admin Dashboards, Symptom Checkers, etc.).
*   **OOS13:** PWA-specific features *beyond* basic compatibility with the host app (e.g., dedicated offline functionality for this module).

**4. Assumptions**

*   **A1:** The main Baylor Health application can securely provide the necessary logged-in user context (UserID, Name, DOB) to the HealthConnect backend APIs. The mechanism for this will be defined and feasible.
*   **A2:** The main Baylor Health application provides the necessary navigation entry point to launch this HealthConnect booking feature.
*   **A3:** Mock data structures and content agreed upon are sufficient for Phase 1 functionality.
*   **A4:** Redis (Upstash) is approved and suitable for temporary session state management.
*   **A5:** The target front-end stack allows for integration of the specified components/libraries, or alternatives will be identified.
*   **A6:** Developer has access to necessary Baylor Health development standards and potentially a testing environment for integration.

**5. Constraints**

*   **C1:** Dependency on the host Baylor Health application for authentication, user context, and UI container/styling.
*   **C2:** Use of mock data only; no connection to real schedules or patient records.
*   **C3:** Data persistence limited to Redis session TTL. No long-term storage of booking attempts.
*   **C4:** Reliance on Upstash Redis availability.
*   **C5:** Development must adhere to Baylor Health's technical and security standards.
*   **C6:** Implicit budget/time constraints for Phase 1 delivery.

**6. Deliverables (Phase 1)**

*   **D1:** Functional form-based appointment booking module integrated within the Baylor Health application environment (deployed to staging/testing environment).
*   **D2:** Source code in Git repository, including application code, API routes, component definitions, mock data, tests.
*   **D3:** Code documentation (comments) and README explaining setup, integration points, and API usage.
*   **D4:** Test suite results (unit, integration).
*   **D5:** Usability and accessibility testing reports (if applicable).

**7. High-Level Acceptance Criteria (Phase 1)**

*   Baylor users can access the feature, and their context is correctly identified.
*   Users can successfully select "Self" or "Someone Else" for the appointment.
*   Relevant fields are correctly pre-filled when "Self" is selected.
*   Users can successfully enter patient details when "Someone Else" is selected.
*   Users can select preferences, view mock availability, choose a slot, review a summary, and receive a mock confirmation.
*   Form state is reasonably preserved during minor interruptions via Redis session.
*   The feature functions correctly within the Baylor app across supported platforms/browsers.
*   Performance and accessibility targets are met.

---
