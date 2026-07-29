from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime

class OptionBase(BaseModel):
    option_text: str = Field(..., description="Text content of the option")
    display_order: int = Field(..., description="Order of the option (e.g. 1, 2, 3)")
    is_correct: bool = Field(False, description="Whether this option is the correct answer")


class OptionCreateInQuestion(OptionBase):
    """Schema for creating an option when embedded inside QuestionCreate."""
    pass


class OptionCreate(OptionBase):
    """Schema for creating a standalone option for an existing question."""
    question_id: UUID = Field(..., description="ID of the question this option belongs to")


class OptionUpdate(BaseModel):
    option_text: str | None = None
    display_order: int | None = None
    is_correct: bool | None = None
    question_id: UUID | None = None

class OptionResponse(OptionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    question_id: UUID
    created_at: datetime
    updated_at: datetime

