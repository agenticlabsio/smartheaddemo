from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from app.redis_client import r
from app.models import BookingData
import random

router = APIRouter()

@router.post("/update-booking-form")
async def update_form(request: Request, data: BookingData):
    user_id = request.headers.get("X-User-ID")
    redis_key = f"session:apollo:{user_id}"
    session = await r.get(redis_key)
    if session:
        session["bookingData"] = data.dict()
        await r.set(redis_key, session, ex=3600)
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Session not found"})

@router.post("/book-appointment")
async def book_appointment(request: Request):
    user_id = request.headers.get("X-User-ID")
    redis_key = f"session:apollo:{user_id}"
    session = await r.get(redis_key)

    if not session or not session.get("bookingData"):
        return JSONResponse(status_code=400, content={"error": "No booking data"})

    # Simulate slot conflict randomly
    if random.choice([True, False]):
        return JSONResponse(status_code=409, content={"error": "Slot unavailable"})

    confirmation_id = f"APT-{random.randint(1000, 9999)}"
    return {"message": "Appointment confirmed", "appointmentId": confirmation_id}
