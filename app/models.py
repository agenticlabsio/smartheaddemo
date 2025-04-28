from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any, Optional, List, Union
from enum import Enum


# Enums for validation
class WeekStart(str, Enum):
    SUNDAY = "Sunday"
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"

class Theme(str, Enum):
    LIGHT = "LIGHT"
    DARK = "DARK"

class TimeFormat(str, Enum):
    TWELVE = "TWELVE"
    TWENTY_FOUR = "TWENTY_FOUR"

class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class Metadata(BaseModel):
    key: str

class User(BaseModel):
    id: Optional[int] = None
    username: str
    name: Optional[str] = None
    email: str
    emailVerified: Optional[datetime] = None
    bio: Optional[str] = ""
    timeZone: Optional[str] = None
    weekStart: Optional[str] = None
    endTime: Optional[int] = None
    bufferTime: Optional[int] = None
    appTheme: Optional[str] = None
    theme: Optional[str] = None
    defaultScheduleId: Optional[int] = None
    locale: Optional[str] = None
    timeFormat: Optional[int] = None
    hideBranding: Optional[bool] = None
    brandColor: Optional[str] = None
    darkBrandColor: Optional[str] = None
    allowDynamicBooking: Optional[bool] = None
    createdDate: Optional[datetime] = None
    verified: Optional[bool] = None
    invitedTo: Optional[str] = None
    role: Optional[str] = None

class UsersResponse(BaseModel):
    users: List[User]
    total: int

class UserCreateRequest(BaseModel):
    email: str
    username: str
    weekStart: Optional[WeekStart] = None
    brandColor: Optional[str] = None
    darkBrandColor: Optional[str] = None
    timeZone: Optional[str] = None
    theme: Optional[Theme] = None
    timeFormat: Optional[TimeFormat] = None
    locale: Optional[str] = None

class UserUpdateRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    weekStart: Optional[WeekStart] = None
    brandColor: Optional[str] = None
    darkBrandColor: Optional[str] = None
    timeZone: Optional[str] = None
    theme: Optional[Theme] = None
    timeFormat: Optional[TimeFormat] = None
    locale: Optional[str] = None

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

class UserCreateRequest(BaseModel):
    email: str
    username: str
    weekStart: Optional[str] = "SUNDAY"
    brandColor: Optional[str] = None
    darkBrandColor: Optional[str] = None
    timeZone: Optional[str] = "America/New_York"
    theme: Optional[str] = "LIGHT"
    timeFormat: Optional[str] = "TWELVE"
    locale: Optional[str] = "en"

class UserUpdateRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    weekStart: Optional[str] = None
    brandColor: Optional[str] = None
    darkBrandColor: Optional[str] = None
    timeZone: Optional[str] = None
    theme: Optional[str] = None
    timeFormat: Optional[str] = None
    locale: Optional[str] = None

class AttendeeCreateRequest(BaseModel):
    bookingId: int
    email: str
    name: str
    timeZone: Optional[str] = None

class AttendeeUpdateRequest(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    timeZone: Optional[str] = None
