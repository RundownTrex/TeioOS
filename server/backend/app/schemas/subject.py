from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

class SubjectBase(BaseModel):
    name: str = Field(..., max_length=255, description="Name of the subject")
    subject_code: str = Field(..., max_length=50, description="Short code for the subject (e.g., CS501)")

class SubjectCreate(SubjectBase):
    department_id: UUID = Field(..., description="UUID of the department this subject belongs to")

class SubjectUpdate(BaseModel):
    name: str | None = Field(None, max_length=255, description="Name of the subject")
    subject_code: str | None = Field(None, max_length=50, description="Short code for the subject (e.g., CS501)")
    department_id: UUID | None = Field(None, description="UUID of the department this subject belongs to")

class SubjectResponse(SubjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    department_id: UUID
    created_at: datetime
    updated_at: datetime
