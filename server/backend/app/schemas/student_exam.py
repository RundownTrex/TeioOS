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
    created_at: datetime
    updated_at: datetime
