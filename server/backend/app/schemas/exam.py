from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

class ExamBase(BaseModel):
    title: str | None = Field(None, max_length=255, description="Optional exam title; falls back to the subject name in the UI")
    duration_minutes: int = Field(..., gt=0, description="Duration in minutes")
    total_marks: int = Field(..., gt=0, description="Total marks for the exam")

class ExamCreate(ExamBase):
    # Optional: the route stamps the authenticated administrator via the JWT.
    created_by: UUID | None = Field(None, description="UUID of the admin/teacher creating this exam")
    subject_id: UUID = Field(..., description="UUID of the subject this exam belongs to")

class ExamUpdate(BaseModel):
    title: str | None = Field(None, max_length=255, description="Optional exam title")
    duration_minutes: int | None = Field(None, gt=0, description="Duration in minutes")
    total_marks: int | None = Field(None, gt=0, description="Total marks for the exam")
    created_by: UUID | None = Field(None, description="UUID of the admin/teacher creating this exam")
    subject_id: UUID | None = Field(None, description="UUID of the subject this exam belongs to")

class ExamResponse(ExamBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: UUID
    subject_id: UUID
    question_count: int = 0
    created_at: datetime
    updated_at: datetime
