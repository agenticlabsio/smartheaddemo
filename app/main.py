from fastapi import FastAPI, HTTPException, Depends, Query, Body, Path, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List, Union
import requests
import os
from models import *
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Agentic Labs - Health Connect",
    description="Chatbook",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

user_router = APIRouter()
availabilities_router = APIRouter()
attendees_router = APIRouter()
bookings_router = APIRouter()

CAL_API_KEY = os.getenv("CAL_API_KEY")
CAL_API_BASE_URL = "https://api.cal.com/v1"
CAL_API_USERS_URL = f"{CAL_API_BASE_URL}/users"
CAL_API_ATTENDEES_URL = f"{CAL_API_BASE_URL}/attendees"
CAL_API_SLOTS_URL = f"{CAL_API_BASE_URL}/slots"
CAL_API_BOOKINGS_URL = "https://api.cal.com/v1/bookings"
CAL_API_AVAILABILITIES_URL = "https://api.cal.com/v1/availabilities"

# Function to get API key as query parameter
def get_cal_api_params():
    return {"apiKey": CAL_API_KEY}

# Routes
@app.get("/")
def read_root():
    return {"message": "Cal.com API Integration with FastAPI"}

# User API endpoints
@user_router.get("/users", response_model=APIResponse)
async def get_users(params: Dict = Depends(get_cal_api_params)):
    """
    Get all users
    """
    url = CAL_API_USERS_URL
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        print(api_response)
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@user_router.post("/users", response_model=APIResponse)
async def create_user(
    user_data: UserCreateRequest = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Create a new user
    """
    url = CAL_API_USERS_URL
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(
            url, 
            json=user_data.dict(exclude_none=True), 
            params=params,
            headers=headers
        )
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@user_router.get("/users/{user_id}", response_model=APIResponse)
async def get_user(
    user_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Get a specific user by ID
    """
    url = f"{CAL_API_USERS_URL}/{user_id}"
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@user_router.patch("/users/{user_id}", response_model=APIResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdateRequest = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Update an existing user
    """
    url = f"{CAL_API_USERS_URL}/{user_id}"
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.patch(
            url, 
            json=user_data.dict(exclude_none=True), 
            params=params,
            headers=headers
        )
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@user_router.delete("/users/{user_id}", response_model=APIResponse)
async def delete_user(
    user_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Delete a user by ID
    """
    url = f"{CAL_API_USERS_URL}/{user_id}"
    try:
        response = requests.delete(url, params=params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

# Attendees API endpoints
@attendees_router.get("/attendees", response_model=APIResponse)
async def get_attendees(params: Dict = Depends(get_cal_api_params)):
    """
    Get all attendees
    """
    url = CAL_API_ATTENDEES_URL
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@attendees_router.post("/attendees", response_model=APIResponse)
async def create_attendee(
    attendee_data: AttendeeCreateRequest = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Create a new attendee
    """
    url = CAL_API_ATTENDEES_URL
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(
            url, 
            json=attendee_data.dict(exclude_none=True), 
            params=params,
            headers=headers
        )
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@attendees_router.get("/attendees/{attendee_id}", response_model=APIResponse)
async def get_attendee(
    attendee_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Get a specific attendee by ID
    """
    url = f"{CAL_API_ATTENDEES_URL}/{attendee_id}"
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@attendees_router.patch("/attendees/{attendee_id}", response_model=APIResponse)
async def update_attendee(
    attendee_id: str,
    attendee_data: AttendeeUpdateRequest = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Update an existing attendee
    """
    url = f"{CAL_API_ATTENDEES_URL}/{attendee_id}"
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.patch(
            url, 
            json=attendee_data.dict(exclude_none=True), 
            params=params,
            headers=headers
        )
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@attendees_router.delete("/attendees/{attendee_id}", response_model=APIResponse)
async def delete_attendee(
    attendee_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Delete an attendee by ID
    """
    url = f"{CAL_API_ATTENDEES_URL}/{attendee_id}"
    try:
        response = requests.delete(url, params=params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )


@availabilities_router.post("/availabilities", response_model=APIResponse)
async def create_availability(
    payload: Dict = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Create a new availability
    """
    try:
        response = requests.post(
            CAL_API_AVAILABILITIES_URL,
            json=payload,
            params=params,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@availabilities_router.get("/availabilities/{availability_id}", response_model=APIResponse)
async def get_availability(
    availability_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Get a specific availability by ID
    """
    url = f"{CAL_API_AVAILABILITIES_URL}/{availability_id}"
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@availabilities_router.patch("/availabilities/{availability_id}", response_model=APIResponse)
async def update_availability(
    availability_id: str,
    payload: Dict = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Update an availability
    """
    url = f"{CAL_API_AVAILABILITIES_URL}/{availability_id}"
    try:
        response = requests.patch(
            url,
            json=payload,
            params=params,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@availabilities_router.delete("/availabilities/{availability_id}", response_model=APIResponse)
async def delete_availability(
    availability_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Delete an availability by ID
    """
    url = f"{CAL_API_AVAILABILITIES_URL}/{availability_id}"
    try:
        response = requests.delete(url, params=params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )
    
@bookings_router.post("/bookings", response_model=APIResponse)
async def create_booking(
    payload: Dict = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Create a new booking
    """
    try:
        response = requests.post(
            CAL_API_BOOKINGS_URL,
            json=payload,
            params=params,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@bookings_router.get("/bookings/{booking_id}", response_model=APIResponse)
async def get_booking(
    booking_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Get a specific booking by ID
    """
    url = f"{CAL_API_BOOKINGS_URL}/{booking_id}"
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@bookings_router.patch("/bookings/{booking_id}", response_model=APIResponse)
async def update_booking(
    booking_id: str,
    payload: Dict = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Update a booking
    """
    url = f"{CAL_API_BOOKINGS_URL}/{booking_id}"
    try:
        response = requests.patch(
            url,
            json=payload,
            params=params,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@bookings_router.delete("/bookings/{booking_id}/cancel", response_model=APIResponse)
async def cancel_booking(
    booking_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Cancel a booking by ID
    """
    url = f"{CAL_API_BOOKINGS_URL}/{booking_id}/cancel"
    try:
        response = requests.delete(url, params=params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@bookings_router.get("/slots", response_model=APIResponse)
async def get_slots(
    start_time: str = Query(..., description="Start time (ISO format, required)"),
    end_time: str = Query(..., description="End time (ISO format, required)"),
    event_type_id: Optional[int] = Query(None, description="Event Type ID"),
    time_zone: Optional[str] = Query(None, description="Time zone"),
    username_list: Optional[List[str]] = Query(None, description="List of usernames"),
    event_type_slug: Optional[str] = Query(None, description="Event type slug"),
    org_slug: Optional[str] = Query(None, description="Organization slug"),
    is_team_event: Optional[bool] = Query(None, description="Is team event"),
    params: Dict[str, Any] = Depends(get_cal_api_params),
):
    """
    Get available bookable slots from Cal.com
    """
    url = CAL_API_SLOTS_URL

    # Build query parameters
    query_params = params.copy()
    query_params.update({
        "startTime": start_time,
        "endTime": end_time,
    })
    if event_type_id is not None:
        query_params["eventTypeId"] = event_type_id
    if time_zone is not None:
        query_params["timeZone"] = time_zone
    if username_list is not None:
        query_params["usernameList"] = username_list
    if event_type_slug is not None:
        query_params["eventTypeSlug"] = event_type_slug
    if org_slug is not None:
        query_params["orgSlug"] = org_slug
    if is_team_event is not None:
        query_params["isTeamEvent"] = is_team_event

    try:
        response = requests.get(url, params=query_params)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )


app.include_router(user_router, prefix="/user", tags=["User"])
app.include_router(availabilities_router, prefix="/availabilities", tags=["Availability"])
app.include_router(attendees_router, prefix="/attendees", tags=["Attendee"])
app.include_router(bookings_router, prefix="/bookings", tags=["Booking"])


# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)