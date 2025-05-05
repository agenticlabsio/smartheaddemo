import json
import redis
from typing import Optional, Dict, Any, TypeVar, Type, Generic, Union
from datetime import datetime, timedelta
from pydantic import BaseModel

from models import BookingState

# Type variable for generic Redis client
T = TypeVar('T', bound=BaseModel)


class RedisClient(Generic[T]):
    """
    Redis client for handling session data
    Generic class to handle different types of state models
    """
    
    def __init__(self, redis_url: str, prefix: str = "session:chatbook:", ttl_seconds: int = 3600):
        """
        Initialize Redis client
        
        Args:
            redis_url: Redis connection URL
            prefix: Key prefix for Redis keys
            ttl_seconds: Time-to-live for session data in seconds (default: 1 hour)
        """
        self.redis = redis.from_url(redis_url)
        self.prefix = prefix
        self.ttl_seconds = ttl_seconds
        
    def _get_key(self, user_id: str) -> str:
        """Generate Redis key for a user session"""
        return f"{self.prefix}{user_id}"
    
    def get_session(self, user_id: str, model_class: Type[T]) -> Optional[T]:
        """
        Get session data for a user
        
        Args:
            user_id: User ID
            model_class: Pydantic model class for deserialization
            
        Returns:
            Session data as Pydantic model or None if not found
        """
        key = self._get_key(user_id)
        data = self.redis.get(key)
        
        if not data:
            return None
            
        try:
            return model_class.model_validate(json.loads(data))
        except Exception as e:
            print(f"Error deserializing session data: {e}")
            return None
    
    def set_session(self, user_id: str, session_data: Union[T, Dict[str, Any]]) -> bool:
        """
        Set session data for a user
        
        Args:
            user_id: User ID
            session_data: Session data (Pydantic model or dict)
            
        Returns:
            True if successful, False otherwise
        """
        key = self._get_key(user_id)
        
        # Convert to dict if it's a Pydantic model
        if isinstance(session_data, BaseModel):
            data = session_data.model_dump()
        else:
            data = session_data
            
        try:
            self.redis.setex(
                key, 
                self.ttl_seconds,
                json.dumps(data)
            )
            return True
        except Exception as e:
            print(f"Error setting session data: {e}")
            return False
    
    def update_session(self, user_id: str, updates: Dict[str, Any], model_class: Type[T]) -> Optional[T]:
        """
        Update session data for a user
        
        Args:
            user_id: User ID
            updates: Dictionary of fields to update
            model_class: Pydantic model class for deserialization
            
        Returns:
            Updated session data as Pydantic model or None if failed
        """
        key = self._get_key(user_id)
        data = self.redis.get(key)
        
        if not data:
            return None
            
        try:
            current_data = json.loads(data)
            # Update the data
            current_data.update(updates)
            
            # Save back to Redis
            self.redis.setex(
                key,
                self.ttl_seconds,
                json.dumps(current_data)
            )
            
            # Return updated model
            return model_class.model_validate(current_data)
        except Exception as e:
            print(f"Error updating session data: {e}")
            return None
    
    def delete_session(self, user_id: str) -> bool:
        """
        Delete session data for a user
        
        Args:
            user_id: User ID
            
        Returns:
            True if deleted, False otherwise
        """
        key = self._get_key(user_id)
        try:
            self.redis.delete(key)
            return True
        except Exception as e:
            print(f"Error deleting session data: {e}")
            return False
    
    def extend_session(self, user_id: str) -> bool:
        """
        Extend the TTL for a session
        
        Args:
            user_id: User ID
            
        Returns:
            True if extended, False otherwise
        """
        key = self._get_key(user_id)
        try:
            # Get current data
            data = self.redis.get(key)
            if not data:
                return False
                
            # Reset TTL
            self.redis.expire(key, self.ttl_seconds)
            return True
        except Exception as e:
            print(f"Error extending session TTL: {e}")
            return False
    
    def get_session_ttl(self, user_id: str) -> Optional[int]:
        """
        Get remaining TTL for a session
        
        Args:
            user_id: User ID
            
        Returns:
            Remaining TTL in seconds or None if session doesn't exist
        """
        key = self._get_key(user_id)
        try:
            ttl = self.redis.ttl(key)
            return ttl if ttl > 0 else None
        except Exception as e:
            print(f"Error getting session TTL: {e}")
            return None


# Create a specialized class for BookingState
class BookingStateRedisClient(RedisClient[BookingState]):
    """Redis client specialized for BookingState model"""
    
    def __init__(self, redis_url: str, ttl_seconds: int = 3600):
        super().__init__(redis_url, prefix="session:chatbook:", ttl_seconds=ttl_seconds)
    
    def get_booking_state(self, user_id: str) -> Optional[BookingState]:
        """
        Get booking state for a user
        
        Args:
            user_id: User ID
            
        Returns:
            BookingState or None if not found
        """
        return self.get_session(user_id, BookingState)
    
    def set_booking_state(self, user_id: str, booking_state: BookingState) -> bool:
        """
        Set booking state for a user
        
        Args:
            user_id: User ID
            booking_state: BookingState model
            
        Returns:
            True if successful, False otherwise
        """
        return self.set_session(user_id, booking_state)
    
    def update_booking_state(self, user_id: str, updates: Dict[str, Any]) -> Optional[BookingState]:
        """
        Update booking state for a user
        
        Args:
            user_id: User ID
            updates: Dictionary of fields to update
            
        Returns:
            Updated BookingState or None if failed
        """
        return self.update_session(user_id, updates, BookingState)
    
    def create_new_booking_session(self, user_id: str, session_id: str) -> BookingState:
        """
        Create a new booking session state
        
        Args:
            user_id: User ID
            session_id: Session ID
            
        Returns:
            New BookingState
        """
        new_state = BookingState(
            user_id=user_id,
            session_id=session_id,
        )
        self.set_booking_state(user_id, new_state)
        return new_state