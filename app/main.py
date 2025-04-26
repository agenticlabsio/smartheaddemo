from fastapi import FastAPI, HTTPException, Depends, Query, Body, Path
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

CAL_API_KEY = os.getenv("CAL_API_KEY")
CAL_API_BASE_URL = "https://api.cal.com/v2"
CAL_API_SLOTS_URL = f"{CAL_API_BASE_URL}/slots"
CAL_API_RESERVATIONS_URL = f"{CAL_API_SLOTS_URL}/reservations"
CAL_API_BOOKINGS_URL = f"{CAL_API_BASE_URL}/bookings"
CAL_API_SCHEDULES_URL = f"{CAL_API_BASE_URL}/schedules"
CAL_API_EVENT_TYPES_URL = f"{CAL_API_BASE_URL}/event-types"
CAL_API_AVAILABILITY_URL = f"{CAL_API_BASE_URL}/availability"

# Dependency for headers
def get_cal_headers():
    return {"Authorization": f"Bearer {CAL_API_KEY}"}  # Updated to use Bearer token

# Routes
@app.get("/")
def read_root():
    return {"message": "Cal.com API Integration with FastAPI"}

@app.get("/bookings", response_model=APIResponse)
async def get_bookings(
    status: Optional[str] = Query(None, description="Filter bookings by status"),
    limit: Optional[int] = Query(10, description="Number of results per page"),
    page: Optional[int] = Query(1, description="Page number for pagination"),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Get all bookings for the authenticated user
    """
    url = f"{CAL_API_BOOKINGS_URL}"
    params = {}
    if status:
        params["status"] = status
    if limit:
        params["limit"] = limit
    if page:
        params["page"] = page
    
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.get("/bookings/{booking_id}", response_model=APIResponse)
async def get_booking(
    booking_id: int,
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Get details of a specific booking
    """
    url = f"{CAL_API_BOOKINGS_URL}/{booking_id}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.delete("/bookings/{booking_id}", response_model=APIResponse)
async def cancel_booking(
    booking_id: int,
    cancellation_reason: Optional[str] = Query(None, description="Reason for cancellation"),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Cancel a booking
    """
    url = f"{CAL_API_BOOKINGS_URL}/{booking_id}"
    params = {}
    if cancellation_reason:
        params["cancellationReason"] = cancellation_reason
    
    try:
        response = requests.delete(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.get("/schedules", response_model=APIResponse)
async def get_schedules(headers: Dict[str, str] = Depends(get_cal_headers)):
    """
    Get all schedules for the authenticated user
    """
    url = f"{CAL_API_SCHEDULES_URL}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        api_response = response.json()
        return APIResponse(status="success", data=api_response.get("data", []), error={})

    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@app.get("/schedules/{schedule_id}", response_model=APIResponse)
async def get_schedule(
    schedule_id: int,
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Get details of a specific schedule
    """
    url = f"{CAL_API_SCHEDULES_URL}/{schedule_id}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.get("/event-types", response_model=APIResponse)
async def get_event_types(headers: Dict[str, str] = Depends(get_cal_headers)):
    """
    Get all event types for the authenticated user
    """
    url = f"{CAL_API_EVENT_TYPES_URL}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        api_data = response.json()
        return {
            "status": "success",
            "data": [api_data],  # wrap it in a list
            "error": {}
        }
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.get("/event-types/{event_type_id}", response_model=APIResponse)
async def get_event_type(
    event_type_id: int,
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Get details of a specific event type
    """
    url = f"{CAL_API_EVENT_TYPES_URL}/{event_type_id}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.get("/availability", response_model=APIResponse)
async def get_availability(
    date_from: str = Query(..., description="Start date in ISO format (YYYY-MM-DD)"),
    date_to: str = Query(..., description="End date in ISO format (YYYY-MM-DD)"),
    event_type_id: Optional[int] = Query(None, description="Event Type ID"),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Get availability for a date range
    """
    url = f"{CAL_API_AVAILABILITY_URL}"
    params = {
        "dateFrom": date_from,
        "dateTo": date_to
    }
    if event_type_id:
        params["eventTypeId"] = event_type_id
        
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                            detail=f"Cal.com API error: {str(e)}")

@app.get("/slots", response_model=APIResponse)
async def get_slots(
    event_type_id: int = Query(..., description="Event Type ID"),
    start_time: str = Query(..., description="Start time in ISO format"),
    end_time: str = Query(..., description="End time in ISO format"),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Get available slots for a specific event type and time range
    """
    url = CAL_API_SLOTS_URL
    params = {
        "eventTypeId": event_type_id,
        "startTime": start_time,
        "endTime": end_time
    }
        
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                            detail=f"Cal.com API error: {str(e)}")

@app.post("/reservations", response_model=APIResponse)
async def create_reservation(
    reservation_data: ReservationRequest = Body(...),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Reserve a slot
    """
    url = CAL_API_RESERVATIONS_URL
    try:
        response = requests.post(url, json=reservation_data.dict(exclude_none=True), headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                            detail=f"Cal.com API error: {str(e)}")

@app.get("/reservations/{reservation_uid}", response_model=APIResponse)
async def get_reservation(
    reservation_uid: str,
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Get a specific reservation by UID
    """
    url = f"{CAL_API_RESERVATIONS_URL}/{reservation_uid}"
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                            detail=f"Cal.com API error: {str(e)}")
    
@app.delete("/reservations/{reservation_uid}", response_model=APIResponse)
async def delete_reservation(
    reservation_uid: str,
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Delete a reservation by UID
    """
    url = f"{CAL_API_RESERVATIONS_URL}/{reservation_uid}"
    try:
        response = requests.delete(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                            detail=f"Cal.com API error: {str(e)}")

@app.patch("/reservations/{reservation_uid}", response_model=APIResponse)
async def update_reservation(
    reservation_uid: str,
    update_data: ReservationRequest = Body(...),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Update an existing reservation
    """
    url = f"{CAL_API_RESERVATIONS_URL}/{reservation_uid}"
    try:
        response = requests.patch(url, json=update_data.dict(exclude_none=True), headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                            detail=f"Cal.com API error: {str(e)}")

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)