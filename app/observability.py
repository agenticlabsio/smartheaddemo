import os
from langfuse import Langfuse
from langfuse.decorators import observe
from langfuse.callback import CallbackHandler as LangfuseCallbackHandler
from typing import Optional, Dict, Any, List, Union
from fastapi import Request
from uuid import uuid4

# Initialize Langfuse client
langfuse = Langfuse(
    public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
    host=os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")
)

def get_langfuse_callback_handler(
    session_id: str = None, 
    user_id: str = None, 
    trace_id: str = None,
    tags: List[str] = None
) -> LangfuseCallbackHandler:
    """
    Create a Langfuse callback handler for LangChain
    
    Args:
        session_id: Optional session ID for tracking
        user_id: Optional user ID for tracking
        trace_id: Optional trace ID for linking events
        tags: Optional list of tags
        
    Returns:
        LangfuseCallbackHandler instance
    """
    # Create the handler with the correct parameters based on the API version
    handler = LangfuseCallbackHandler(
        session_id=session_id,
        user_id=user_id,
        tags=tags or []
    )
    
    # If trace_id is provided, set it on the handler
    if trace_id:
        handler.trace_id = trace_id
    
    return handler

# Decorator for tracking API endpoints
def trace_endpoint(name: str, tags: List[str] = None):
    """
    Decorator for tracing FastAPI endpoints
    
    Args:
        name: Name of the trace
        tags: Optional list of tags
    """
    def decorator(func):
        from functools import wraps
        
        @wraps(func)  # This preserves the original function's signature for FastAPI
        async def wrapper(*args, **kwargs):
            # Extract request object if available
            request = None
            user_id = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            # Extract user ID if available
            if "current_user" in kwargs and hasattr(kwargs["current_user"], "id"):
                user_id = str(kwargs["current_user"].id)
            
            # Generate trace ID if not in request
            trace_id = str(uuid4())
            
            # Create trace
            trace = langfuse.trace(
                name=name,
                id=trace_id,
                user_id=user_id,
                tags=tags or []
            )
            
            # Add metadata from request if available
            if request:
                trace.update(
                    metadata={
                        "path": request.url.path,
                        "method": request.method,
                    }
                )
            
            # Execute the original function
            try:
                result = await func(*args, **kwargs)
                
                # Mark trace as successful
                trace.update(status="success")
                
                return result
            except Exception as e:
                # Mark trace as error
                trace.update(
                    status="error",
                    metadata={"error": str(e)}
                )
                raise
            # Remove the trace.end() call as StatefulTraceClient doesn't have this method
                
        return wrapper
    return decorator

# Function to log chat messages
def log_chat_interaction(
    session_id: str,
    user_id: str,
    user_message: str,
    bot_response: str,
    metadata: Dict[str, Any] = None,
    tags: List[str] = None
):
    """
    Log chat interactions to Langfuse
    
    Args:
        session_id: Session ID for tracking
        user_id: User ID for tracking
        user_message: Message from user
        bot_response: Response from bot
        metadata: Additional metadata
        tags: Optional list of tags
    """
    try:
        # Create a unique trace ID
        trace_id = f"chat-{session_id}-{uuid4()}"
        
        # Create trace for the chat interaction
        trace = langfuse.trace(
            name="chat_interaction",
            id=trace_id,
            user_id=user_id,
            session_id=session_id,
            tags=tags or []
        )
        
        # Log user message as a span
        user_message_span = trace.span(
            name="user_message",
            input={"message": user_message},
        )
        # Make sure to end the span
        if hasattr(user_message_span, 'end'):
            user_message_span.end()
        
        # Log bot response as a span
        bot_response_span = trace.span(
            name="bot_response",
            output={"message": bot_response},
        )
        # Make sure to end the span
        if hasattr(bot_response_span, 'end'):
            bot_response_span.end()
        
        # Add metadata if provided
        if metadata:
            trace.update(metadata=metadata)
            
    except Exception as e:
        # Log any errors but don't break the application flow
        print(f"Error logging chat interaction to Langfuse: {str(e)}")