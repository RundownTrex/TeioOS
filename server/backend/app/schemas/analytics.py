import uuid
from datetime import datetime
from typing import List
from pydantic import BaseModel


class AnalyticsOverviewResponse(BaseModel):
    """Dashboard analytics — count of exam sessions awaiting manual evaluation."""
    pending_evaluations: int


class StudentOverviewResponse(BaseModel):
    """Session-level aggregates across all exam schedules."""
    total_assigned: int
    started: int
    submitted: int
    in_progress: int
    not_started: int
    expired: int
    terminated: int


class CurrentSessionResponse(BaseModel):
    """An active examination session (assignment status = in_progress)."""
    id: uuid.UUID
    studentName: str
    rollNumber: str
    examName: str
    subjectName: str
    startedAt: datetime
    expiresAt: datetime
    lastActivityAt: datetime | None


class SubmissionStatusCount(BaseModel):
    status: str
    count: int


class ExamPerformanceResponse(BaseModel):
    """Average performance per exam, derived from published results."""
    id: uuid.UUID
    examName: str
    averagePercentage: float
    submissions: int


class PendingEvaluationResponse(BaseModel):
    """An exam session with descriptive answers still awaiting manual evaluation."""
    id: uuid.UUID
    studentName: str
    rollNumber: str
    subjectName: str
    pendingAnswers: int
    submittedAt: datetime


class SubmissionStatusListResponse(BaseModel):
    items: List[SubmissionStatusCount]


class CurrentSessionsListResponse(BaseModel):
    items: List[CurrentSessionResponse]


class PendingEvaluationsListResponse(BaseModel):
    items: List[PendingEvaluationResponse]


class ExamPerformanceListResponse(BaseModel):
    items: List[ExamPerformanceResponse]
