"""
Improved Redis client implementation for BookingState management
with better error handling and connection retries
"""
import json
import logging
import time
from typing import Dict, Any, List, Optional, Union
import redis

logger = logging.getLogger(__name__)

class BookingStateRedisClient:
    """Redis client for managing booking state and conversation history"""
    
    def __init__(
        self, 
        host: str = "localhost", 
        port: int = 6379, 
        db: int = 0, 
        password: Optional[str] = None,
        max_retries: int = 3,
        retry_delay: float = 0.5
    ):
        """Initialize the Redis client
        
        Args:
            host: Redis host
            port: Redis port
            db: Redis DB number
            password: Redis password
            max_retries: Maximum number of connection retries
            retry_delay: Delay between retries in seconds
        """
        self.host = host
        self.port = port
        self.db = db
        self.password = password
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self._redis = None
        
        # Try to connect immediately
        self._connect()
    
    def _connect(self) -> bool:
        """Connect to Redis with retries
        
        Returns:
            True if connection successful, False otherwise
        """
        for attempt in range(self.max_retries):
            try:
                self._redis = redis.Redis(
                    host=self.host,
                    port=self.port,
                    db=self.db,
                    password=self.password,
                    socket_timeout=5,
                    decode_responses=True  # Auto-decode bytes to str
                )
                # Test connection
                self._redis.ping()
                logger.info(f"Connected to Redis at {self.host}:{self.port}")
                return True
            except redis.exceptions.ConnectionError as e:
                logger.warning(f"Redis connection attempt {attempt+1}/{self.max_retries} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay)
                else:
                    logger.error("All Redis connection attempts failed")
                    self._redis = None
                    return False
            except Exception as e:
                logger.error(f"Unexpected error connecting to Redis: {e}")
                self._redis = None
                return False
        return False
    
    @property
    def redis(self) -> redis.Redis:
        """Get the Redis connection, reconnecting if necessary
        
        Returns:
            Redis connection
        
        Raises:
            ConnectionError: If connection fails
        """
        if self._redis is None:
            if not self._connect():
                raise ConnectionError("Cannot connect to Redis")
        
        # Try a ping to ensure connection is still alive
        try:
            self._redis.ping()
        except (redis.exceptions.ConnectionError, AttributeError):
            logger.warning("Redis connection lost, attempting to reconnect")
            if not self._connect():
                raise ConnectionError("Redis connection lost and reconnection failed")
        
        return self._redis
    
    def get_booking_state(self, user_id: str) -> Dict[str, Any]:
        """Get booking state from Redis
        
        Args:
            user_id: User ID
            
        Returns:
            Booking state as dict, empty dict if not found
        """
        try:
            state_json = self.redis.get(f"booking_state:{user_id}")
            if state_json:
                return json.loads(state_json)
            return {}
        except ConnectionError as e:
            logger.error(f"Redis connection error in get_booking_state: {e}")
            return {}
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in booking state for user {user_id}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error getting booking state for user {user_id}: {e}")
            return {}
    
    def update_booking_state(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update booking state in Redis
        
        Args:
            user_id: User ID
            updates: Dict of updates to apply
            
        Returns:
            Updated booking state as dict, empty dict if failed
        """
        try:
            # Get current state
            current_state = self.get_booking_state(user_id)
            
            # Apply updates
            updated_state = {**current_state, **updates}
            
            # Save to Redis
            self.redis.set(f"booking_state:{user_id}", json.dumps(updated_state))
            
            return updated_state
        except ConnectionError as e:
            logger.error(f"Redis connection error in update_booking_state: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error updating booking state for user {user_id}: {e}")
            return {}
    
    def get_conversation_history(self, session_id: str) -> List:
        """Get conversation history from Redis
        
        Args:
            session_id: Session ID
            
        Returns:
            Conversation history as list, empty list if not found
        """
        try:
            history_json = self.redis.get(f"conversation:{session_id}")
            if history_json:
                return json.loads(history_json)
            return []
        except ConnectionError as e:
            logger.error(f"Redis connection error in get_conversation_history: {e}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in conversation history for session {session_id}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error getting conversation history for session {session_id}: {e}")
            return []
    
    def save_conversation_history(self, session_id: str, messages: List) -> bool:
        """Save conversation history to Redis
        
        Args:
            session_id: Session ID
            messages: List of message objects
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Serialize messages (need to convert to dict first)
            serializable_messages = []
            for msg in messages:
                if hasattr(msg, "dict"):
                    serializable_messages.append(msg.dict())
                else:
                    # Fallback for basic serialization
                    msg_type = msg.__class__.__name__
                    content = getattr(msg, "content", str(msg))
                    serializable_messages.append({
                        "type": msg_type,
                        "content": content,
                    })
            
            self.redis.set(f"conversation:{session_id}", json.dumps(serializable_messages))
            return True
        except ConnectionError as e:
            logger.error(f"Redis connection error in save_conversation_history: {e}")
            return False
        except Exception as e:
            logger.error(f"Error saving conversation history for session {session_id}: {e}")
            return False
    
    def clear_booking_state(self, user_id: str) -> bool:
        """Clear booking state from Redis
        
        Args:
            user_id: User ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.redis.delete(f"booking_state:{user_id}")
            return True
        except ConnectionError as e:
            logger.error(f"Redis connection error in clear_booking_state: {e}")
            return False
        except Exception as e:
            logger.error(f"Error clearing booking state for user {user_id}: {e}")
            return False
    
    def clear_conversation_history(self, session_id: str) -> bool:
        """Clear conversation history from Redis
        
        Args:
            session_id: Session ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.redis.delete(f"conversation:{session_id}")
            return True
        except ConnectionError as e:
            logger.error(f"Redis connection error in clear_conversation_history: {e}")
            return False
        except Exception as e:
            logger.error(f"Error clearing conversation history for session {session_id}: {e}")
            return False