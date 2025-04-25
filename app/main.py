from fastapi import FastAPI, HTTPException, Depends, Query, Body, Path
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List, Union
import requests
import os
from models import *
from datetime import datetime

app = FastAPI(
    title="Cal.com API Integration",
    description="A FastAPI application integrating with Cal.com API",
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

# Environment variables (load from .env in production)
CAL_CLIENT_ID = os.getenv("CAL_CLIENT_ID", "your-client-id")
CAL_SECRET_KEY = os.getenv("CAL_SECRET_KEY", "your-secret-key")
CAL_API_BASE_URL = "https://api.cal.com/v2/oauth-clients"
CAL_API_OAUTH_URL = "https://api.cal.com/v2/oauth"
CAL_API_ORG_URL = "https://api.cal.com/v2/organizations"
CAL_API_SLOTS_URL = "https://api.cal.com/v2/slots"
CAL_API_RESERVATIONS_URL = f"{CAL_API_SLOTS_URL}/reservations"

# Dependency for headers
def get_cal_headers():
    return {"x-cal-secret-key": CAL_SECRET_KEY}

# Routes
@app.get("/")
def read_root():
    return {"message": "Cal.com API Integration with FastAPI"}

@app.get("/users", response_model=APIResponse)
async def get_users(headers: Dict[str, str] = Depends(get_cal_headers)):
    """
    Get all users associated with the Cal.com client ID
    """
    url = f"{CAL_API_BASE_URL}/{CAL_CLIENT_ID}/users"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.post("/users", response_model=APIResponse)
async def create_user(
    user_data: CreateUserRequest = Body(...),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Create a new user in Cal.com
    """
    url = f"{CAL_API_BASE_URL}/{CAL_CLIENT_ID}/users"
    
    try:
        response = requests.post(
            url, 
            json=user_data.dict(exclude_none=True),
            headers={**headers, "Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.get("/users/{user_id}", response_model=APIResponse)
async def get_user(
    user_id: int,
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Get a specific user by ID
    """
    url = f"{CAL_API_BASE_URL}/{CAL_CLIENT_ID}/users/{user_id}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.delete("/users/{user_id}", response_model=APIResponse)
async def delete_user(
    user_id: int,
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Delete a user by ID
    """
    url = f"{CAL_API_BASE_URL}/{CAL_CLIENT_ID}/users/{user_id}"
    
    try:
        response = requests.delete(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.patch("/users/{user_id}", response_model=APIResponse)
async def update_user(
    user_id: int,
    user_data: UpdateUserRequest = Body(...),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Update a user by ID
    """
    url = f"{CAL_API_BASE_URL}/{CAL_CLIENT_ID}/users/{user_id}"
    
    try:
        response = requests.patch(
            url, 
            json=user_data.dict(exclude_none=True),
            headers={**headers, "Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.post("/users/{user_id}/force-refresh", response_model=APIResponse)
async def force_refresh_token(
    user_id: int,
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Force refresh tokens for a user
    """
    url = f"{CAL_API_BASE_URL}/{CAL_CLIENT_ID}/users/{user_id}/force-refresh"
    
    try:
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.post("/oauth/refresh", response_model=APIResponse)
async def refresh_oauth_token(
    refresh_data: RefreshTokenRequest = Body(...),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Refresh an OAuth token using a refresh token
    """
    url = f"{CAL_API_OAUTH_URL}/{CAL_CLIENT_ID}/refresh"
    
    try:
        response = requests.post(
            url, 
            json=refresh_data.dict(),
            headers={**headers, "Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.get("/organizations/{org_id}/bookings", response_model=APIResponse)
async def get_organization_bookings(
    org_id: int = Path(..., description="Organization ID"),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Get all bookings for an organization
    """
    url = f"{CAL_API_ORG_URL}/{org_id}/bookings"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")

@app.get("/organizations/{org_id}/schedules", response_model=APIResponse)
async def get_organization_schedules(
    org_id: int = Path(..., description="Organization ID"),
    headers: Dict[str, str] = Depends(get_cal_headers)
):
    """
    Get all schedules for an organization
    """
    url = f"{CAL_API_ORG_URL}/{org_id}/schedules"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                           detail=f"Cal.com API error: {str(e)}")
    
@app.get("/slots", response_model=APIResponse)
async def get_slots(headers: Dict[str, str] = Depends(get_cal_headers)):
    """
    Get available slots
    """
    url = CAL_API_SLOTS_URL
    try:
        response = requests.get(url, headers=headers)
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
        response = requests.post(url, json=reservation_data.dict(), headers=headers)
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
        response = requests.patch(url, json=update_data.dict(), headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=response.status_code if hasattr(response, 'status_code') else 500,
                            detail=f"Cal.com API error: {str(e)}")

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)