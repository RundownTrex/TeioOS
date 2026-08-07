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

class StudentResultInfo(BaseModel):
    """
    Sanitized evaluation and published result status for the student client.
    Exposes marks/grade ONLY if `is_published` is True.
    """
    model_config = ConfigDict(from_attributes=True)

    is_published: bool
    published_at: datetime | None = None
    obtained_marks: float | None = None
    total_marks: float | None = None
    percentage: float | None = None
    grade: str | None = None
    evaluation_status: str


class ExamSessionResponse(BaseModel):
    """
    The candidate's personal examination session.

    The frontend derives all examination timing from this object (expires_at,
    started_at, duration) instead of the ExamSchedule availability window.
    """
    model_config = ConfigDict(from_attributes=True)

    assignment_id: UUID
    started_at: datetime | None = None
    expires_at: datetime | None = None
    submitted_at: datetime | None = None
    status: str
    duration: int
    last_activity_at: datetime | None = None
    paused_at: datetime | None = None
    result: StudentResultInfo | None = None


class ExamSessionSnapshotResponse(ExamSessionResponse):
    """Snapshot of the candidate's exam session plus the authoritative server time.

    Extends ExamSessionResponse so all session fields remain at the top level,
    with `server_current_time` added alongside. The frontend recomputes its clock
    offset from `server_current_time` on every periodic synchronization.
    """
    server_current_time: datetime


class ExamInstructionResponse(BaseModel):
    """Payload for GET /instructions."""
    model_config = ConfigDict(from_attributes=True)
    
    schedule_id: UUID
    exam_title: str | None = None
    subject_name: str
    subject_code: str
    department_name: str
    duration_minutes: int
    total_marks: float
    total_questions: int = 0
    mcq_count: int = 0
    descriptive_count: int = 0
    instructions: str | None = None
    start_time: datetime
    end_time: datetime
    status: str
    session: ExamSessionResponse | None = None

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
    session: ExamSessionResponse | None = None


class ExamStartResponse(BaseModel):
    """Payload for POST /start."""
    access_token: str
    token_type: str = "bearer"
    exam_session_id: UUID
    server_current_time: datetime
    expires_at: datetime
    session: ExamSessionResponse


class ExamSubmitConfirmation(BaseModel):
    """Payload confirmation response for POST /submit."""
    exam_session_id: UUID
    status: str
    is_auto_submitted: bool
    submitted_at: datetime
    message: str = "Exam submitted successfully"


# --- Exam Review Models (For Published Results) ---

class OptionReviewItem(BaseModel):
    """Option details revealed for published exam review."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    option_text: str
    is_correct: bool
    is_selected: bool = False


class QuestionReviewItem(BaseModel):
    """Question review item with candidate answer and evaluation telemetry."""
    model_config = ConfigDict(from_attributes=True)

    question_id: UUID
    question_text: str
    question_type: QuestionType = QuestionType.MCQ
    marks: float
    negative_marks: float = 0.0
    obtained_marks: float = 0.0
    status: str  # CORRECT, INCORRECT, PARTIAL, UNANSWERED
    saved_answer_option_id: Optional[UUID] = None
    saved_answer_text: Optional[str] = None
    evaluator_feedback: Optional[str] = None
    options: List[OptionReviewItem] = []


class ExamReviewResponse(BaseModel):
    """Full published exam review payload."""
    model_config = ConfigDict(from_attributes=True)

    schedule_id: UUID
    subject_name: str
    subject_code: str
    department_name: str
    total_marks: float
    obtained_marks: float
    percentage: float
    grade: Optional[str] = None
    published_at: datetime
    questions: List[QuestionReviewItem] = []

