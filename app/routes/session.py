from fastapi import APIRouter, Request
from app.redis_client import r
from app.models import Session
import time

router = APIRouter()

@router.get("/session")
async def get_session(request: Request):
    user_id = request.headers.get("X-User-ID")
    redis_key = f"session:apollo:{user_id}"
    data = await r.get(redis_key)

    if data:
        return {"session": data}
    else:
        session_data = {
            "id": redis_key,
            "apolloUserId": user_id,
            "created": int(time.time()),
            "lastActive": int(time.time()),
            "bookingData": None
        }
        await r.set(redis_key, session_data, ex=3600)
        return {"session": session_data}
