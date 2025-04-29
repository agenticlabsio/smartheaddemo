from fastapi import FastAPI, HTTPException, Depends, Query, Body, Path, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List, Union
import requests
import os
from fastapi.security import OAuth2PasswordBearer
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

auth_router = APIRouter()
user_router = APIRouter()
availabilities_router = APIRouter()
attendees_router = APIRouter()
bookings_router = APIRouter()
event_router = APIRouter()
schedule_router = APIRouter()
webhooks_router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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

# Webhook Helper Functions
def make_request(method: str, url: str, data: dict = None, headers: dict = None, params: dict = None):
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, params=params)
        elif method == "PATCH":
            response = requests.patch(url, json=data, headers=headers, params=params)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, params=params)

        response.raise_for_status()
        return response.json() if response.content else {}
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )
    
@webhooks_router.get("/webhooks", response_model=APIResponse)
async def get_webhooks(params: Dict = Depends(get_cal_api_params)):
    url = "https://api.cal.com/v1/webhooks"
    api_response = make_request("GET", url, data=None, params=params)
    return APIResponse(status="success", data=api_response, error={})

@webhooks_router.post("/webhooks", response_model=APIResponse)
async def create_webhook(
    payload: Dict = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    url = "https://api.cal.com/v1/webhooks"
    headers = {"Content-Type": "application/json"}
    api_response = make_request("POST", url, data=payload, headers=headers, params=params)
    return APIResponse(status="success", data=api_response, error={})

@webhooks_router.get("/webhooks/{webhook_id}", response_model=APIResponse)
async def get_webhook(
    webhook_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    url = f"https://api.cal.com/v1/webhooks/{webhook_id}"
    api_response = make_request("GET", url, data=None, params=params)
    return APIResponse(status="success", data=api_response, error={})

@webhooks_router.delete("/webhooks/{webhook_id}", response_model=APIResponse)
async def delete_webhook(
    webhook_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    url = f"https://api.cal.com/v1/webhooks/{webhook_id}"
    api_response = make_request("DELETE", url, data=None, params=params)
    return APIResponse(status="success", data=api_response, error={})

@webhooks_router.patch("/webhooks/{webhook_id}", response_model=APIResponse)
async def update_webhook(
    webhook_id: str,
    payload: Dict = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    url = f"https://api.cal.com/v1/webhooks/{webhook_id}"
    headers = {"Content-Type": "application/json"}
    api_response = make_request("PATCH", url, data=payload, headers=headers, params=params)
    return APIResponse(status="success", data=api_response, error={})

# User API endpoints
# Dependency to get the current user from the token
async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # First check Redis for an active session
    session_data = get_user_session(token)
    if not session_data:
        # If no active session, try to decode and validate the token
        payload = decode_token(token)
        if payload is None:
            raise credentials_exception
            
        # Check if token is expired
        expiration = datetime.fromtimestamp(payload.get("exp", 0))
        if datetime.utcnow() > expiration:
            raise credentials_exception
            
        # Verify user exists in Cal.com
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_exception
            
        # Return user data from token payload
        return {
            "user_id": user_id,
            "role": payload.get("role", "USER")
        }
    
    # Return user data from session
    return {
        "user_id": session_data.get("user_id"),
        "username": session_data.get("username"),
        "email": session_data.get("email"),
        "role": session_data.get("role", "USER")
    }

@auth_router.post("/login", response_model=APIResponse)
async def login(
    login_data: LoginRequest = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Login a user and create a session
    """
    # This endpoint would need to be customized based on how Cal.com authentication works
    # For now, we'll simulate a login by fetching the user by email
    
    try:
        # First, get all users
        url = f"{CAL_API_BASE_URL}/users"
        response = requests.get(url, params=params)
        response.raise_for_status()
        users_response = response.json()
        
        # Find the user with the matching email
        user = None
        for user_data in users_response.get("users", []):
            if user_data.get("email") == login_data.email:
                user = user_data
                break
                
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        # In a real-world scenario, you would verify the password here
        # For this example, we'll just assume the password is correct
        
        # Create tokens
        user_id = str(user.get("id"))
        username = user.get("username")
        email = user.get("email")
        role = user.get("role", "USER")
        
        access_token_data = create_access_token(user_id, role)
        refresh_token_data = create_refresh_token(user_id)
        
        access_token = access_token_data["access_token"]
        refresh_token = refresh_token_data["refresh_token"]
        access_token_expires_at = access_token_data["expires_at"]
        refresh_token_expires_at = refresh_token_data["expires_at"]
        
        # Store session in Redis
        session_created = create_user_session(
            user_id=user_id,
            username=username,
            email=email,
            role=role,
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_at=access_token_expires_at,
            refresh_token_expires_at=refresh_token_expires_at
        )
        
        if not session_created:
            raise HTTPException(status_code=500, detail="Failed to create user session")
            
        # Return the response
        login_response = {
            "user_id": user_id,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "access_token_expires_at": access_token_expires_at.isoformat(),
            "refresh_token_expires_at": refresh_token_expires_at.isoformat(),
        }
        
        # Include user details
        user_data = {
            "id": user.get("id"),
            "username": username,
            "email": email,
            "role": role
        }
        
        return APIResponse(
            status="success", 
            data={"token": login_response, "user": user_data}
        )
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=e.response.status_code if hasattr(e, 'response') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during login: {str(e)}")

@auth_router.post("/logout", response_model=APIResponse)
async def logout(
    logout_data: LogoutRequest = Body(...),
    current_user: Dict = Depends(get_current_user)
):
    """
    Logout a user and invalidate their session
    """
    try:
        # Invalidate the session in Redis
        session_invalidated = invalidate_session(logout_data.access_token)
        
        if not session_invalidated:
            raise HTTPException(status_code=500, detail="Failed to invalidate user session")
            
        return APIResponse(
            status="success", 
            data={"message": "Successfully logged out"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during logout: {str(e)}")

@auth_router.post("/refresh-token", response_model=APIResponse)
async def refresh_token(
    refresh_token: str = Body(..., embed=True)
):
    """
    Refresh an access token using a refresh token
    """
    try:
        # Validate the refresh token
        refresh_data = validate_refresh_token(refresh_token)
        
        if not refresh_data:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
            
        # Get user details from refresh token data
        user_id = refresh_data.get("user_id")
        old_access_token = refresh_data.get("access_token")
        
        # Invalidate the old session
        invalidate_session(old_access_token)
        
        # Get user details from Cal.com
        url = f"{CAL_API_BASE_URL}/users/{user_id}"
        params = get_cal_api_params()
        response = requests.get(url, params=params)
        response.raise_for_status()
        user = response.json()
        
        username = user.get("username")
        email = user.get("email")
        role = user.get("role", "USER")
        
        # Create new tokens
        access_token_data = create_access_token(user_id, role)
        refresh_token_data = create_refresh_token(user_id)
        
        access_token = access_token_data["access_token"]
        new_refresh_token = refresh_token_data["refresh_token"]
        access_token_expires_at = access_token_data["expires_at"]
        refresh_token_expires_at = refresh_token_data["expires_at"]
        
        # Store new session in Redis
        session_created = create_user_session(
            user_id=user_id,
            username=username,
            email=email,
            role=role,
            access_token=access_token,
            refresh_token=new_refresh_token,
            access_token_expires_at=access_token_expires_at,
            refresh_token_expires_at=refresh_token_expires_at
        )
        
        if not session_created:
            raise HTTPException(status_code=500, detail="Failed to create user session")
            
        # Return the response
        token_response = {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "access_token_expires_at": access_token_expires_at.isoformat(),
            "refresh_token_expires_at": refresh_token_expires_at.isoformat(),
        }
        
        return APIResponse(
            status="success", 
            data=token_response
        )
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=e.response.status_code if hasattr(e, 'response') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing token: {str(e)}")

@auth_router.get("/me", response_model=APIResponse)
async def get_current_user_details(
    current_user: Dict = Depends(get_current_user),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Get details of the currently authenticated user
    """
    try:
        user_id = current_user.get("user_id")
        
        # Get the full user details from Cal.com
        url = f"{CAL_API_BASE_URL}/users/{user_id}"
        response = requests.get(url, params=params)
        response.raise_for_status()
        user_data = response.json()
        
        return APIResponse(
            status="success", 
            data=user_data
        )
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=e.response.status_code if hasattr(e, 'response') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user details: {str(e)}")

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
    
@event_router.get("/event-types", response_model=APIResponse)
async def get_event_types(params: Dict = Depends(get_cal_api_params)):
    """
    Get all event types
    """
    url = "https://api.cal.com/v1/event-types"
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

@event_router.post("/event-types", response_model=APIResponse)
async def create_event_type(
    event_data: Dict = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Create a new event type
    """
    url = "https://api.cal.com/v1/event-types"
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(url, json=event_data, params=params, headers=headers)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )

@event_router.get("/event-types/{event_type_id}", response_model=APIResponse)
async def get_event_type(
    event_type_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Get a specific event type by ID
    """
    url = f"https://api.cal.com/v1/event-types/{event_type_id}"
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

@event_router.delete("/event-types/{event_type_id}", response_model=APIResponse)
async def delete_event_type(
    event_type_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Delete an event type by ID
    """
    url = f"https://api.cal.com/v1/event-types/{event_type_id}"
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

@event_router.patch("/event-types/{event_type_id}", response_model=APIResponse)
async def update_event_type(
    event_type_id: str,
    event_data: Dict = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Update an event type by ID
    """
    url = f"https://api.cal.com/v1/event-types/{event_type_id}"
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.patch(url, json=event_data, params=params, headers=headers)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )
    
@event_router.get("/teams/{team_id}/event-types", response_model=APIResponse)
async def get_event_types_for_team(
    team_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Get event types for a specific team
    """
    url = f"https://api.cal.com/v1/teams/{team_id}/event-types"
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
    
@schedule_router.get("/schedules", response_model=APIResponse)
async def get_schedules(params: Dict = Depends(get_cal_api_params)):
    """
    Get all schedules
    """
    url = "https://api.cal.com/v1/schedules"
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

@schedule_router.post("/schedules", response_model=APIResponse)
async def create_schedule(
    schedule_data: Dict = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Create a new schedule
    """
    url = "https://api.cal.com/v1/schedules"
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(url, json=schedule_data, params=params, headers=headers)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )
    
@schedule_router.get("/schedules/{schedule_id}", response_model=APIResponse)
async def get_schedule(
    schedule_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Get a specific schedule by ID
    """
    url = f"https://api.cal.com/v1/schedules/{schedule_id}"
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

@schedule_router.delete("/schedules/{schedule_id}", response_model=APIResponse)
async def delete_schedule(
    schedule_id: str,
    params: Dict = Depends(get_cal_api_params)
):
    """
    Delete a schedule by ID
    """
    url = f"https://api.cal.com/v1/schedules/{schedule_id}"
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
    
@schedule_router.patch("/schedules/{schedule_id}", response_model=APIResponse)
async def update_schedule(
    schedule_id: str,
    schedule_data: Dict = Body(...),
    params: Dict = Depends(get_cal_api_params)
):
    """
    Update a schedule by ID
    """
    url = f"https://api.cal.com/v1/schedules/{schedule_id}"
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.patch(url, json=schedule_data, params=params, headers=headers)
        response.raise_for_status()
        api_response = response.json() if response.content else {}
        return APIResponse(status="success", data=api_response, error={})
    except requests.RequestException as e:
        raise HTTPException(
            status_code=response.status_code if hasattr(response, 'status_code') else 500,
            detail=f"Cal.com API error: {str(e)}"
        )


app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(user_router, prefix="/user", tags=["User"])
app.include_router(availabilities_router, prefix="/availabilities", tags=["Availability"])
app.include_router(attendees_router, prefix="/attendees", tags=["Attendee"])
app.include_router(bookings_router, prefix="/bookings", tags=["Booking"])
app.include_router(event_router, prefix="/event-types", tags=["Event"])
app.include_router(schedule_router, prefix="/schedules", tags=["Schedule"])
app.include_router(webhooks_router, prefix="/webhooks", tags=["Webhook"])

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)