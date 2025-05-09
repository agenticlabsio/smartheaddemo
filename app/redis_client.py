import json
import redis
from typing import Optional, Dict, Any, TypeVar, Type, Generic, Union
from datetime import datetime, timedelta
from pydantic import BaseModel
import time

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
class BookingStateRedisClient:
    def __init__(self, redis_url, ttl_seconds=3600):
        """
        Initialize Redis client for booking state management
        
        Args:
            redis_url: Redis connection URL
            ttl_seconds: Time-to-live for session data in seconds
        """
        import redis
        from models import BookingState
        
        self.redis = redis.from_url(redis_url)
        self.ttl_seconds = ttl_seconds
        self.BookingState = BookingState
    
    def _get_session_key(self, user_id):
        """Generate Redis key for user session"""
        return f"booking:state:{user_id}"
    
    def _get_conversation_key(self, user_id):
        """Generate Redis key for user conversation history"""
        return f"booking:conversation:{user_id}"
    
    def create_new_booking_session(self, user_id, session_id):
        """
        Create a new booking session in Redis
        
        Args:
            user_id: User ID
            session_id: Session ID
            
        Returns:
            BookingState object
        """
        state = self.BookingState(
            user_id=user_id,
            session_id=session_id
        )
        
        # Store in Redis
        self.redis.set(
            self._get_session_key(user_id),
            state.model_dump_json(),
            ex=self.ttl_seconds
        )
        
        # Initialize empty conversation history
        self.redis.delete(self._get_conversation_key(user_id))
        
        return state
    
    def get_booking_state(self, user_id):
        """
        Get booking state from Redis
        
        Args:
            user_id: User ID
            
        Returns:
            BookingState object or None if not found
        """
        import json
        
        data = self.redis.get(self._get_session_key(user_id))
        if not data:
            return None
        
        return self.BookingState.model_validate(json.loads(data))
    
    def update_booking_state(self, user_id, updates):
        """
        Update booking state in Redis
        
        Args:
            user_id: User ID
            updates: Dict of fields to update
            
        Returns:
            Updated BookingState or None if session not found
        """
        import json
        
        # Get current state
        current_state = self.get_booking_state(user_id)
        if not current_state:
            return None
        
        # Update state
        updated_state = current_state.model_copy(update=updates)
        
        # Store back in Redis
        self.redis.set(
            self._get_session_key(user_id),
            updated_state.model_dump_json(),
            ex=self.ttl_seconds
        )
        
        return updated_state
    
    def get_session_ttl(self, user_id):
        """
        Get remaining TTL for a session
        
        Args:
            user_id: User ID
            
        Returns:
            TTL in seconds or None if not found
        """
        ttl = self.redis.ttl(self._get_session_key(user_id))
        return ttl if ttl > 0 else None
    
    def delete_session(self, user_id):
        """
        Delete a session from Redis
        
        Args:
            user_id: User ID
            
        Returns:
            True if deleted, False if not found
        """
        # Delete state and conversation history
        state_deleted = self.redis.delete(self._get_session_key(user_id)) > 0
        self.redis.delete(self._get_conversation_key(user_id))
        
        return state_deleted
    
    # Implementing the missing method
    def get_conversation_history(self, user_id):
        """
        Get conversation history for a user
        
        Args:
            user_id: User ID
            
        Returns:
            List of conversation messages or empty list if none found
        """
        import json
        
        # Get all conversation messages from Redis list
        messages_raw = self.redis.lrange(self._get_conversation_key(user_id), 0, -1)
        
        # Parse JSON messages
        messages = []
        for msg_raw in messages_raw:
            try:
                msg = json.loads(msg_raw)
                messages.append(msg)
            except json.JSONDecodeError:
                # Skip corrupted messages
                continue
        
        return messages
    
    def add_conversation_message(self, user_id, role, content):
        """
        Add a message to the conversation history
        
        Args:
            user_id: User ID
            role: Message role ('user' or 'assistant')
            content: Message content
            
        Returns:
            None
        """
        import json
        
        # Create message object
        message = {
            "role": role,
            "content": content,
            "timestamp": time.time()
        }
        
        # Add to Redis list
        self.redis.rpush(
            self._get_conversation_key(user_id),
            json.dumps(message)
        )
        
        # Ensure TTL is set
        self.redis.expire(self._get_conversation_key(user_id), self.ttl_seconds)

    def save_conversation_history(self, user_id, conversation_history):
        """
        Save entire conversation history for a user
        
        Args:
            user_id: User ID
            conversation_history: List of message dictionaries with 'role' and 'content' keys
            
        Returns:
            True if successful, False otherwise
        """
        import json
        
        try:
            # Delete existing conversation history
            self.redis.delete(self._get_conversation_key(user_id))
            
            # Add each message to the conversation history
            for message in conversation_history:
                # Ensure timestamp exists
                if 'timestamp' not in message:
                    message['timestamp'] = time.time()
                    
                # Add to Redis list
                self.redis.rpush(
                    self._get_conversation_key(user_id),
                    json.dumps(message)
                )
            
            # Ensure TTL is set
            self.redis.expire(self._get_conversation_key(user_id), self.ttl_seconds)
            return True
        except Exception as e:
            print(f"Error saving conversation history: {e}")
            return False