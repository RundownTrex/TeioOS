from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime

class StudentAssignmentCreate(BaseModel):
    student_id: UUID = Field(..., description="ID of the student to assign")

class StudentAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    exam_schedule_id: UUID
    started_at: datetime | None = None
    expires_at: datetime | None = None
    submitted_at: datetime | None = None
    last_activity_at: datetime | None = None
    status: str | None = None
    resume_count: int = 0
    is_auto_submitted: bool = False
    created_at: datetime
    updated_at: datetime
