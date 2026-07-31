from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID


class DescriptiveEvaluationRequest(BaseModel):
    awarded_marks: float = Field(..., description="Marks awarded for this answer")
    evaluator_feedback: str | None = Field(None, description="Optional feedback from evaluator")


class StudentAnswerEvaluationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    answered_at: datetime
    student_exam_id: UUID
    question_id: UUID
    selected_option_id: UUID | None = None
    answer_text: str | None = None
    awarded_marks: float | None = None
    evaluator_feedback: str | None = None
    evaluated_at: datetime | None = None
    evaluated_by: UUID | None = None
