from datetime import datetime, timezone
from typing import Generic, TypeVar, Any
from pydantic import BaseModel, Field

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    """
    Generic API Response wrapper.
    Ensures all endpoints return a consistent shape.
    """
    success: bool
    message: str
    data: T | None = None
    errors: list[str] | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
