from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

from app.models.question import QuestionType
from app.schemas.option import OptionCreateInQuestion, OptionResponse


# --- Questions ---

class QuestionBase(BaseModel):
    question_text: str = Field(..., description="Text content of the question")
    question_type: QuestionType = Field(QuestionType.MCQ, description="Type of question: MCQ or DESCRIPTIVE")
    marks: float = Field(..., gt=0, description="Marks awarded for correct answer")
    negative_marks: float = Field(0.0, ge=0, description="Marks deducted for wrong answer (MCQ only)")
    # Optional on create: the service appends at the end (max display_order + 1).
    display_order: int | None = Field(None, description="Order of the question in the exam; auto-assigned when omitted")
    max_characters: int | None = Field(None, gt=0, description="Maximum allowed characters for descriptive answer")
    exam_id: UUID = Field(..., description="ID of the exam this question belongs to")


class QuestionCreate(QuestionBase):
    options: list[OptionCreateInQuestion] | None = Field(None, description="List of MCQ options (required for MCQ, forbidden for DESCRIPTIVE)")


class QuestionUpdate(BaseModel):
    question_text: str | None = None
    question_type: QuestionType | None = None
    marks: float | None = Field(None, gt=0)
    negative_marks: float | None = Field(None, ge=0)
    display_order: int | None = None
    max_characters: int | None = Field(None, gt=0)
    exam_id: UUID | None = None
    options: list[OptionCreateInQuestion] | None = Field(None, description="Provide this to fully replace existing options")


class QuestionReorder(BaseModel):
    ordered_ids: list[UUID] = Field(..., description="Question IDs in their desired display order (a permutation of the exam's questions)")


class QuestionResponse(QuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_order: int
    created_at: datetime
    updated_at: datetime
    options: list[OptionResponse] = []
