def get_mock_availability(location, specialty, doctor=None):
    return {
        "location": location,
        "specialty": specialty,
        "doctor": doctor or "Any Available",
        "slots": [
            "2025-04-23T10:00:00",
            "2025-04-23T10:30:00",
            "2025-04-23T11:00:00"
        ]
    }
