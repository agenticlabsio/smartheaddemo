import redis
r = redis.Redis.from_url("your-upstash-url")

def load_session(user_id):
    return r.get(f"session:apollo:{user_id}")

def save_session(user_id, session_data):
    r.setex(f"session:apollo:{user_id}", 3600, json.dumps(session_data))