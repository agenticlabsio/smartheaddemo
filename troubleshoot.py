#!/usr/bin/env python
"""
Troubleshooting script for the BookingAgent connection error
"""
import os
import sys
import logging
import json
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("booking_agent_debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("booking_agent_debugger")

# Import dependencies - wrap in try blocks to identify import issues
try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, Session
    logger.info("Successfully imported SQLAlchemy")
except ImportError as e:
    logger.error(f"Failed to import SQLAlchemy: {e}")
    logger.info("Try installing with: pip install sqlalchemy")
    sys.exit(1)

try:
    import redis
    logger.info("Successfully imported Redis")
except ImportError as e:
    logger.error(f"Failed to import Redis: {e}")
    logger.info("Try installing with: pip install redis")
    sys.exit(1)

try:
    from langchain_openai import ChatOpenAI
    logger.info("Successfully imported langchain_openai")
except ImportError as e:
    logger.error(f"Failed to import langchain_openai: {e}")
    logger.info("Try installing with: pip install langchain_openai")
    sys.exit(1)

try:
    from langgraph.graph import StateGraph
    logger.info("Successfully imported langgraph")
except ImportError as e:
    logger.error(f"Failed to import langgraph: {e}")
    logger.info("Try installing with: pip install langgraph")
    sys.exit(1)

# Check for OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    logger.error("OPENAI_API_KEY environment variable is not set")
    logger.info("Set it with: export OPENAI_API_KEY=your_api_key_here")
else:
    logger.info("OPENAI_API_KEY environment variable is set")

# Test Redis connection
def test_redis_connection(host='localhost', port=6379, db=0, password=None):
    """Test the Redis connection"""
    logger.info(f"Testing Redis connection to {host}:{port}")
    try:
        r = redis.Redis(host=host, port=port, db=db, password=password, socket_timeout=5)
        r.ping()
        logger.info("Redis connection successful")
        return True
    except redis.exceptions.ConnectionError as e:
        logger.error(f"Redis connection error: {e}")
        logger.info("Make sure Redis server is running and accessible")
        return False
    except Exception as e:
        logger.error(f"Unexpected Redis error: {e}")
        return False

# Test database connection
def test_db_connection(db_url):
    """Test the database connection"""
    logger.info(f"Testing database connection to {db_url}")
    try:
        engine = create_engine(db_url)
        connection = engine.connect()
        connection.close()
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        logger.info("Make sure the database server is running and accessible")
        return False

# Test OpenAI API connection
def test_openai_connection():
    """Test the OpenAI API connection"""
    if not openai_api_key:
        logger.error("Can't test OpenAI connection without API key")
        return False
    
    logger.info("Testing OpenAI API connection")
    try:
        llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.7,
            api_key=openai_api_key
        )
        # Just try to initialize it - this doesn't actually make an API call
        logger.info("OpenAI client initialization successful")
        
        # Now try a simple completion to verify API access
        try:
            response = llm.invoke("Hello, are you working?")
            logger.info("OpenAI API call successful")
            return True
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            return False
    except Exception as e:
        logger.error(f"OpenAI client initialization failed: {e}")
        return False

# Check booking state redis client
def test_booking_state_client(host='localhost', port=6379, db=0, password=None):
    """Test the BookingStateRedisClient"""
    logger.info("Checking if BookingStateRedisClient can be imported")
    try:
        # Try to import the client
        from redis_client import BookingStateRedisClient
        
        logger.info("Creating BookingStateRedisClient instance")
        redis_client = BookingStateRedisClient(host=host, port=port, db=db, password=password)
        
        # Try to use the client methods
        test_session_id = "test_session_123"
        test_user_id = "test_user_123"
        test_state = {"test_key": "test_value"}
        
        logger.info("Testing update_booking_state method")
        result = redis_client.update_booking_state(test_user_id, test_state)
        if result:
            logger.info("update_booking_state method successful")
        else:
            logger.error("update_booking_state method failed")
        
        logger.info("Testing get_conversation_history method")
        history = redis_client.get_conversation_history(test_session_id)
        logger.info(f"Got conversation history: {history}")
        
        logger.info("Testing save_conversation_history method")
        test_messages = [{"type": "test", "content": "test message"}]
        save_result = redis_client.save_conversation_history(test_session_id, test_messages)
        if save_result:
            logger.info("save_conversation_history method successful")
        else:
            logger.error("save_conversation_history method failed")
        
        return True
    except ImportError as e:
        logger.error(f"Failed to import BookingStateRedisClient: {e}")
        return False
    except Exception as e:
        logger.error(f"Error testing BookingStateRedisClient: {e}")
        return False

# Test BookingAgent initialization
def test_booking_agent(redis_client, db_session):
    """Test creating a BookingAgent instance"""
    logger.info("Testing BookingAgent initialization")
    try:
        from redis_client import BookingStateRedisClient
        # Try to import the agent
        sys.path.append('.')  # Add current directory to path if needed
        
        # Try local import first
        try:
            from your_module_name import BookingAgent
        except ImportError:
            # If that fails, try to import from the code directly
            exec("""
from typing import Optional, Dict, Any, List, TypedDict, Annotated, Literal
import json
import os
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.graph import MessagesState
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

class BookingAgent:
    def __init__(self, redis_client, db):
        self.redis_client = redis_client
        self.db = db
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
""")
            from __main__ import BookingAgent
        
        logger.info("Creating BookingAgent instance")
        agent = BookingAgent(redis_client, db_session)
        logger.info("BookingAgent initialization successful")
        return True
    except ImportError as e:
        logger.error(f"Failed to import BookingAgent: {e}")
        return False
    except Exception as e:
        logger.error(f"Error initializing BookingAgent: {e}")
        traceback_info = sys.exc_info()
        logger.error(f"Traceback: {traceback_info}")
        return False

def main():
    """Main function to run all tests"""
    logger.info("Starting BookingAgent troubleshooting")
    
    # Configuration - update these values as needed
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", "6379"))
    redis_db = int(os.getenv("REDIS_DB", "0"))
    redis_password = os.getenv("REDIS_PASSWORD")
    
    db_url = os.getenv("DATABASE_URL", "sqlite:///test.db")
    
    # Run tests
    redis_ok = test_redis_connection(redis_host, redis_port, redis_db, redis_password)
    db_ok = test_db_connection(db_url)
    openai_ok = test_openai_connection()
    
    # Summary
    logger.info("\n=== Troubleshooting Summary ===")
    logger.info(f"Redis Connection: {'OK' if redis_ok else 'FAILED'}")
    logger.info(f"Database Connection: {'OK' if db_ok else 'FAILED'}")
    logger.info(f"OpenAI API: {'OK' if openai_ok else 'FAILED'}")
    
    # Further tests if basic connections are working
    if redis_ok:
        booking_state_client_ok = test_booking_state_client(redis_host, redis_port, redis_db, redis_password)
        logger.info(f"BookingStateRedisClient: {'OK' if booking_state_client_ok else 'FAILED'}")
        
        if db_ok and booking_state_client_ok:
            # Create minimal DB session and Redis client for agent test
            engine = create_engine(db_url)
            Session = sessionmaker(bind=engine)
            db_session = Session()
            
            from redis_client import BookingStateRedisClient
            redis_client = BookingStateRedisClient(host=redis_host, port=redis_port, db=redis_db, password=redis_password)
            
            booking_agent_ok = test_booking_agent(redis_client, db_session)
            logger.info(f"BookingAgent: {'OK' if booking_agent_ok else 'FAILED'}")
    
    logger.info("Troubleshooting complete. Check booking_agent_debug.log for details.")

if __name__ == "__main__":
    main()