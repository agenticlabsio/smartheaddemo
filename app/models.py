from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any, Optional, List, Union

class TimeFormat(int):
    twelve = 12
    twentyfour = 24

class Metadata(BaseModel):
    key: str

class User(BaseModel):
    id: Optional[int] = None
    email: str
    username: Optional[str] = None
    name: str
    bio: Optional[str] = None
    timeZone: str = "UTC"
    weekStart: str = "Sunday"
    createdDate: Optional[datetime] = None
    timeFormat: int = 12
    defaultScheduleId: Optional[int] = None
    locale: str = "en"
    avatarUrl: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CreateUserRequest(BaseModel):
    email: str
    name: str
    timeFormat: int = 12
    weekStart: str = "Monday"
    timeZone: str = "America/New_York"
    locale: str = "en"
    avatarUrl: Optional[str] = None
    bio: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    timeFormat: Optional[int] = None
    defaultScheduleId: Optional[int] = None
    weekStart: Optional[str] = None
    timeZone: Optional[str] = None
    locale: Optional[str] = None
    avatarUrl: Optional[str] = None
    bio: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class TokenInfo(BaseModel):
    accessToken: str
    refreshToken: str
    accessTokenExpiresAt: int
    refreshTokenExpiresAt: int

class RefreshTokenRequest(BaseModel):
    refreshToken: str

class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    accessTokenExpiresAt: int
    refreshTokenExpiresAt: int

class CreateUserResponse(BaseModel):
    user: User
    accessToken: str
    refreshToken: str
    accessTokenExpiresAt: int
    refreshTokenExpiresAt: int

class APIResponse(BaseModel):
    status: str
    data: Any
    error: Optional[Dict[str, Any]] = None

class EventType(BaseModel):
    id: int
    slug: str

class Host(BaseModel):
    id: int
    name: str
    email: str
    username: str
    timeZone: str

class Attendee(BaseModel):
    name: str
    email: str
    timeZone: str
    phoneNumber: Optional[str] = None
    language: Optional[str] = None

class Booking(BaseModel):
    id: int
    uid: str
    title: str
    description: Optional[str] = None
    hosts: List[Host]
    status: str
    cancellationReason: Optional[str] = None
    cancelledByEmail: Optional[str] = None
    reschedulingReason: Optional[str] = None
    rescheduledByEmail: Optional[str] = None
    rescheduledFromUid: Optional[str] = None
    start: str
    end: str
    duration: int
    eventTypeId: int
    eventType: Optional[EventType] = None
    meetingUrl: Optional[str] = None
    location: Optional[str] = None
    absentHost: Optional[bool] = None
    createdAt: str
    updatedAt: str
    metadata: Optional[Dict[str, Any]] = None
    rating: Optional[int] = None
    icsUid: Optional[str] = None
    attendees: List[Attendee]
    guests: Optional[List[str]] = None
    bookingFieldsResponses: Optional[Dict[str, Any]] = None

class AvailabilityTime(BaseModel):
    days: List[str]
    startTime: str
    endTime: str

class Override(BaseModel):
    date: str
    startTime: str
    endTime: str

class Schedule(BaseModel):
    id: int
    ownerId: int
    name: str
    timeZone: str
    availability: List[AvailabilityTime]
    isDefault: bool
    overrides: Optional[List[Override]] = None

class ReservationRequest(BaseModel):
    eventTypeId: int
    slotStart: str
    slotDuration: str
    reservationDuration: Optional[int] = 5

class APIResponse(BaseModel):
    status: str
    data: Optional[List[dict]]
    error: Optional[dict] = {}