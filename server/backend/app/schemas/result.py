from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

from app.models.result import EvaluationStatus

class ResultBase(BaseModel):
    obtained_marks: float = Field(..., description="Total marks obtained by the student")
    percentage: float = Field(..., description="Percentage scored")
    grade: str | None = Field(None, description="Grade awarded")
    evaluation_status: EvaluationStatus = Field(EvaluationStatus.COMPLETED, description="Status of evaluation: PENDING, PARTIALLY_EVALUATED, or COMPLETED")
    published_at: datetime | None = Field(None, description="When the result was published")
    student_exam_id: UUID = Field(..., description="ID of the associated student exam assignment")


class ResultStudentInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    roll_number: str

class ResultExamInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    total_marks: float
    duration_minutes: int | None = None

class ResultScheduleInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    exam: ResultExamInfo

class ResultStudentExamInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    student: ResultStudentInfo
    exam_schedule: ResultScheduleInfo

class ResultResponse(ResultBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime

    # The actual ORM structure is Result -> StudentExam -> Student / ExamSchedule -> Exam
    student_exam: ResultStudentExamInfo | None = None
