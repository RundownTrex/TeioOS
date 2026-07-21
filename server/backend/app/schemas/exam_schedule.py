from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID
from app.models.exam_schedule import ExamScheduleStatus

class ExamScheduleBase(BaseModel):
    start_time: datetime = Field(..., description="Start time of the schedule (UTC)")
    end_time: datetime = Field(..., description="End time of the schedule (UTC)")
    status: ExamScheduleStatus = Field(ExamScheduleStatus.SCHEDULED, description="Current status of the schedule")
    exam_id: UUID = Field(..., description="ID of the exam this schedule belongs to")

class ExamScheduleCreate(ExamScheduleBase):
    pass

class ExamScheduleUpdate(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: ExamScheduleStatus | None = None
    exam_id: UUID | None = None

class ExamScheduleResponse(ExamScheduleBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
    updated_at: datetime
