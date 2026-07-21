from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from uuid import UUID

class StudentBase(BaseModel):
    roll_number: str = Field(..., max_length=100, description="Unique roll number")
    name: str = Field(..., max_length=255, description="Name of the student")
    date_of_birth: date = Field(..., description="Date of birth of the student")
    class_id: UUID = Field(..., description="ID of the associated class")
    is_active: bool = Field(True, description="Whether the student is active")

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    roll_number: str | None = Field(None, max_length=100, description="Unique roll number")
    name: str | None = Field(None, max_length=255, description="Name of the student")
    date_of_birth: date | None = Field(None, description="Date of birth of the student")
    class_id: UUID | None = Field(None, description="ID of the associated class")
    is_active: bool | None = Field(None, description="Whether the student is active")

class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
