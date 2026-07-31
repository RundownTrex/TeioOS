from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional

from app.models.question import QuestionType


# --- Display Models (Sanitized for Student Client) ---

class OptionDisplay(BaseModel):
    """Sanitized option data, stripping 'is_correct'."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    option_text: str
    display_order: int


class QuestionDisplay(BaseModel):
    """Sanitized question data, providing only what the student needs."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    question_text: str
    question_type: QuestionType = QuestionType.MCQ
    marks: float
    negative_marks: float
    display_order: int
    max_characters: Optional[int] = None
    options: List[OptionDisplay] = []
    
    # Support recovery by including any previously saved answer
    saved_answer_option_id: Optional[UUID] = None
    saved_answer_text: Optional[str] = None


class ExamQuestionsPayload(BaseModel):
    """Payload for GET /questions."""
    questions: List[QuestionDisplay]
    server_current_time: datetime


# --- Request Models ---

class AnswerSubmission(BaseModel):
    """Payload for POST /answers."""
    question_id: UUID
    selected_option_id: Optional[UUID] = None
    answer_text: Optional[str] = None



class ExamSubmitRequest(BaseModel):
    """Optional payload for POST /submit."""
    is_auto_submitted: bool = False


# --- Response Models ---

class ExamInstructionResponse(BaseModel):
    """Payload for GET /instructions."""
    model_config = ConfigDict(from_attributes=True)
    
    schedule_id: UUID
    subject_name: str
    subject_code: str
    department_name: str
    duration_minutes: int
    total_marks: float
    start_time: datetime
    end_time: datetime
    status: str

class StudentAvailableExamResponse(BaseModel):
    """Payload for GET / (Available Exams list)."""
    model_config = ConfigDict(from_attributes=True)
    
    schedule_id: UUID
    subject_name: str
    subject_code: str
    department_name: str
    duration_minutes: int
    total_marks: float
    status: str
    start_time: datetime
    end_time: datetime


class ExamStartResponse(BaseModel):
    """Payload for POST /start."""
    access_token: str
    token_type: str = "bearer"
    exam_session_id: UUID
    server_current_time: datetime
    expires_at: datetime


class ExamSubmitConfirmation(BaseModel):
    """Payload confirmation response for POST /submit."""
    exam_session_id: UUID
    status: str
    is_auto_submitted: bool
    submitted_at: datetime
    message: str = "Exam submitted successfully"
