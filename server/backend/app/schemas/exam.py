from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

class ExamBase(BaseModel):
    duration_minutes: int = Field(..., gt=0, description="Duration in minutes")
    total_marks: int = Field(..., gt=0, description="Total marks for the exam")

class ExamCreate(ExamBase):
    created_by: UUID = Field(..., description="UUID of the admin/teacher creating this exam")
    subject_id: UUID = Field(..., description="UUID of the subject this exam belongs to")

class ExamUpdate(BaseModel):
    duration_minutes: int | None = Field(None, gt=0, description="Duration in minutes")
    total_marks: int | None = Field(None, gt=0, description="Total marks for the exam")
    created_by: UUID | None = Field(None, description="UUID of the admin/teacher creating this exam")
    subject_id: UUID | None = Field(None, description="UUID of the subject this exam belongs to")

class ExamResponse(ExamBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: UUID
    subject_id: UUID
    created_at: datetime
    updated_at: datetime
