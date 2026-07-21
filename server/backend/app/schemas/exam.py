from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

class ExamBase(BaseModel):
    title: str = Field(..., max_length=255, description="Title of the exam")
    description: str | None = Field(None, description="Optional description of the exam")
    duration_minutes: int = Field(..., gt=0, description="Duration in minutes")
    total_marks: int = Field(..., gt=0, description="Total marks for the exam")

class ExamCreate(ExamBase):
    created_by: UUID = Field(..., description="UUID of the admin/teacher creating this exam")

class ExamUpdate(BaseModel):
    title: str | None = Field(None, max_length=255, description="Title of the exam")
    description: str | None = Field(None, description="Optional description of the exam")
    duration_minutes: int | None = Field(None, gt=0, description="Duration in minutes")
    total_marks: int | None = Field(None, gt=0, description="Total marks for the exam")
    created_by: UUID | None = Field(None, description="UUID of the admin/teacher creating this exam")

class ExamResponse(ExamBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
