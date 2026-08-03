"""
Response schemas for user-facing endpoints.
"""

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from uuid import UUID
from app.models.user import UserRole

# Keep existing legacy schemas for backward compatibility
class AdminProfile(BaseModel):
    """Response schema for GET /admin/auth/me."""
    id: UUID
    username: str
    name: str
    email: str
    role: str

class StudentSessionInfo(BaseModel):
    """Response schema for GET /student/auth/me."""
    user_id: str
    roll_number: str
    name: str
    department_name: str
    class_name: str
    role: str
    active_exam_session: str | None = None
    active_exam_schedule: str | None = None


# New comprehensive CRUD schemas
class UserBase(BaseModel):
    username: str = Field(..., max_length=100, description="Unique username")
    name: str = Field(..., max_length=255, description="Full name of the user")
    email: EmailStr = Field(..., description="Valid email address")
    role: UserRole = Field(..., description="Role of the user (e.g., admin, teacher)")
    is_active: bool = Field(True, description="Account active status")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Plaintext password")

class UserUpdate(BaseModel):
    username: str | None = Field(None, max_length=100, description="Unique username")
    name: str | None = Field(None, max_length=255, description="Full name of the user")
    email: EmailStr | None = Field(None, description="Valid email address")
    role: UserRole | None = Field(None, description="Role of the user (e.g., admin, teacher)")
    is_active: bool | None = Field(None, description="Account active status")
    password: str | None = Field(None, min_length=8, description="Plaintext password")

class UserResponse(UserBase):
    """
    Response schema for user CRUD endpoints.
    Explicitly DOES NOT include password or password_hash to prevent exposure.
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
