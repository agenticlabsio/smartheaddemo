import os
import json
import redis
from upstash_redis import Redis
from dotenv import load_dotenv

load_dotenv()

redis_client = Redis(url="https://grateful-pig-29112.upstash.io", token="AXG4AAIjcDFhYWIwYjcxMzMwMjE0MWU4ODY5MzhmNDIzNDg5YzY0NnAxMA")

def load_session(apollo_user_id):
    session = redis_client.get(f"session:apollo:{apollo_user_id}")
    if session:
        return json.loads(session)
    return {}

def save_session(apollo_user_id, data):
    redis_client.setex(f"session:apollo:{apollo_user_id}", 3600, json.dumps(data))