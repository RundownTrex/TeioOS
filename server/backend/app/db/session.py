from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

# Engine Configuration
# `pool_pre_ping=True` ensures the connection is tested before being used, 
# preventing errors if the database restarts or drops connections.
# `pool_size` and `max_overflow` configure a robust connection pool for production.
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Session Configuration
# `autocommit=False` and `autoflush=False` are standard SQLAlchemy patterns 
# to ensure manual control over the transaction boundary and prevent 
# premature flushes to the database.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session,
)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session per request.
    Ensures that the database connection is properly closed after the request is processed,
    even if an exception occurs.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
