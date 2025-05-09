from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from dotenv import load_dotenv
from typing import Generator

# Load environment variables
load_dotenv()

# Get database connection string from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5432/healthconnect")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    pool_pre_ping=True  # Helps detect stale connections
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get a database session.
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    """
    Initialize database by creating all tables.
    Only needed if tables don't exist.
    """
    from models import Base  # Import here to avoid circular imports
    Base.metadata.create_all(bind=engine)