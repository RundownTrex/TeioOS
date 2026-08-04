from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from app.schemas.student import StudentResponse

class StudentAssignmentCreate(BaseModel):
    student_id: UUID = Field(..., description="ID of the student to assign")
    individual_duration_minutes: int | None = Field(
        default=None,
        gt=0,
        le=720,
        description="Per-student exam time override in minutes. Omitted/NULL = use the exam's duration_minutes.",
    )

class StudentAssignmentUpdate(BaseModel):
    individual_duration_minutes: int | None = Field(
        default=None,
        gt=0,
        le=720,
        description="Per-student exam time override in minutes. Omitted/NULL = use the exam's duration_minutes.",
    )

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
    individual_duration_minutes: int | None = None
    student: StudentResponse | None = Field(None, description="Embedded student details")
    created_at: datetime
    updated_at: datetime

class ClassAssignmentCreate(BaseModel):
    class_id: UUID = Field(..., description="ID of the class whose active students should be assigned")

class ClassAssignmentResponse(BaseModel):
    assigned: int = Field(..., description="Number of students newly assigned")
    skipped: int = Field(..., description="Number of students already assigned (skipped)")

class DepartmentAssignmentCreate(BaseModel):
    department_id: UUID = Field(..., description="ID of the department whose active students should be assigned")

class DepartmentAssignmentResponse(BaseModel):
    assigned: int = Field(..., description="Number of students newly assigned")
    skipped: int = Field(..., description="Number of students already assigned (skipped)")
