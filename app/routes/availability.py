from fastapi import APIRouter, Query
from app.utils.mock_data import get_mock_availability

router = APIRouter()

@router.get("/doctor-availability")
def doctor_availability(location: str, specialty: str, doctor: str = None):
    return get_mock_availability(location, specialty, doctor)
