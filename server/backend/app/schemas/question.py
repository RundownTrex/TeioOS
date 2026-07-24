from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

from app.models.question import QuestionType
from app.schemas.option import OptionCreate, OptionResponse


# --- Questions ---

class QuestionBase(BaseModel):
    question_text: str = Field(..., description="Text content of the question")
    question_type: QuestionType = Field(QuestionType.MCQ, description="Type of question: MCQ or DESCRIPTIVE")
    marks: float = Field(..., description="Marks awarded for correct answer")
    negative_marks: float = Field(0.0, description="Marks deducted for wrong answer")
    display_order: int = Field(..., description="Order of the question in the exam")
    max_characters: int | None = Field(None, description="Maximum allowed characters for descriptive answer")
    exam_id: UUID = Field(..., description="ID of the exam this question belongs to")


class QuestionCreate(QuestionBase):
    options: list[OptionCreate] | None = Field(None, description="List of MCQ options (required for MCQ, forbidden for DESCRIPTIVE)")


class QuestionUpdate(BaseModel):
    question_text: str | None = None
    question_type: QuestionType | None = None
    marks: float | None = None
    negative_marks: float | None = None
    display_order: int | None = None
    max_characters: int | None = None
    exam_id: UUID | None = None
    options: list[OptionCreate] | None = Field(None, description="Provide this to fully replace existing options")


class QuestionResponse(QuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    options: list[OptionResponse] = []

