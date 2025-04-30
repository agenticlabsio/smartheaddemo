import os
import json
import redis
from upstash_redis import Redis
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
import redis
import jwt
from app.models import UserRole
from dotenv import load_dotenv

load_dotenv()

redis_client = Redis(url=os.environ.get("UPSTASH_REDIS_REST_URL"), token=os.environ.get("UPSTASH_REDIS_REST_TOKEN"))

def load_session(apollo_user_id):
    session = redis_client.get(f"session:apollo:{apollo_user_id}")
    if session:
        return json.loads(session)
    return {}

def save_session(apollo_user_id, data):
    redis_client.set(f"session:apollo:{apollo_user_id}", json.dumps(data), ex=3600)

# JWT settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is not set")
    
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 minutes
REFRESH_TOKEN_EXPIRE_DAYS = 7     # 7 days

# Initialize Redis connection

def create_access_token(user_id: str, role: str = UserRole.USER) -> Dict[str, Any]:
    """Create a new access token for a user"""
    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta
    
    to_encode = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "role": role
    }
    
    access_token = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return {
        "access_token": access_token,
        "expires_at": expire
    }

def create_refresh_token(user_id: str) -> Dict[str, Any]:
    """Create a new refresh token for a user"""
    expires_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    expire = datetime.utcnow() + expires_delta
    
    to_encode = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    refresh_token = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return {
        "refresh_token": refresh_token,
        "expires_at": expire
    }

def decode_token(token: str) -> Dict[str, Any]:
    """Decode a JWT token and validate it"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def create_user_session(
    user_id: str, 
    username: str, 
    email: str,
    role: str,
    access_token: str,
    refresh_token: str,
    access_token_expires_at: datetime,
    refresh_token_expires_at: datetime
) -> bool:
    """Store user session in Redis"""
    session_key = f"session:{access_token}"
    refresh_token_key = f"refresh:{refresh_token}"
    
    session_data = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "role": role,
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": access_token_expires_at.isoformat()
    }
    
    refresh_data = {
        "user_id": user_id,
        "access_token": access_token,
        "expires_at": refresh_token_expires_at.isoformat()
    }
    
    # Store session data in Redis with expiry
    access_expiry = int((access_token_expires_at - datetime.utcnow()).total_seconds())
    refresh_expiry = int((refresh_token_expires_at - datetime.utcnow()).total_seconds())
    
    try:
        redis_client.setex(
            session_key,
            access_expiry,
            json.dumps(session_data)
        )
        
        redis_client.setex(
            refresh_token_key,
            refresh_expiry,
            json.dumps(refresh_data)
        )
        
        # Also store a user-to-sessions mapping for easy lookup
        user_sessions_key = f"user:{user_id}:sessions"
        redis_client.sadd(user_sessions_key, access_token)
        
        return True
    except Exception as e:
        print(f"Error storing session in Redis: {e}")
        return False

def get_user_session(access_token: str) -> Optional[Dict[str, Any]]:
    """Retrieve user session data from Redis"""
    session_key = f"session:{access_token}"
    
    try:
        session_data = redis_client.get(session_key)
        if not session_data:
            return None
        
        return json.loads(session_data)
    except Exception as e:
        print(f"Error retrieving session from Redis: {e}")
        return None

def validate_refresh_token(refresh_token: str) -> Optional[Dict[str, Any]]:
    """Validate a refresh token and return its data if valid"""
    refresh_token_key = f"refresh:{refresh_token}"
    
    try:
        refresh_data = redis_client.get(refresh_token_key)
        if not refresh_data:
            return None
        
        return json.loads(refresh_data)
    except Exception as e:
        print(f"Error validating refresh token: {e}")
        return None

def invalidate_session(access_token: str) -> bool:
    """Invalidate a user session (logout)"""
    session_key = f"session:{access_token}"
    
    try:
        # Get user_id from session to remove from user-to-sessions mapping
        session_data = redis_client.get(session_key)
        if session_data:
            session_data = json.loads(session_data)
            user_id = session_data.get("user_id")
            
            if user_id:
                user_sessions_key = f"user:{user_id}:sessions"
                redis_client.srem(user_sessions_key, access_token)
        
        # Delete the session
        redis_client.delete(session_key)
        return True
    except Exception as e:
        print(f"Error invalidating session: {e}")
        return False

def invalidate_all_user_sessions(user_id: str) -> bool:
    """Invalidate all sessions for a user"""
    user_sessions_key = f"user:{user_id}:sessions"
    
    try:
        # Get all session tokens for the user
        session_tokens = redis_client.smembers(user_sessions_key)
        
        # Delete each session
        for token in session_tokens:
            session_key = f"session:{token.decode('utf-8')}"
            redis_client.delete(session_key)
        
        # Clear the user-to-sessions mapping
        redis_client.delete(user_sessions_key)
        return True
    except Exception as e:
        print(f"Error invalidating all user sessions: {e}")
        return False