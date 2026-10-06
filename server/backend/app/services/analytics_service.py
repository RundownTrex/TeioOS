from datetime import datetime, timezone
from typing import List

from app.repositories.analytics_repository import AnalyticsRepository
from app.models.student_exam import AssignmentStatus, StudentExam
from app.models.exam import Exam
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    CurrentSessionResponse,
    ExamPerformanceResponse,
    PendingEvaluationResponse,
    StudentOverviewResponse,
    SubmissionStatusCount,
)

_EXAM_DISPLAY_STATUSES = [
    AssignmentStatus.SUBMITTED,
    AssignmentStatus.AUTO_SUBMITTED,
    AssignmentStatus.IN_PROGRESS,
    AssignmentStatus.PENDING,
    AssignmentStatus.EXPIRED,
    AssignmentStatus.TERMINATED,
]


def _display_exam_name(exam: Exam) -> str:
    """Exam title when set, otherwise the subject name (mirrors admin UI)."""
    return exam.title or exam.subject.name


class AnalyticsService:
    """Aggregates examination activity for the admin analytics and monitoring
    views. Thin service: all counting happens in the repository."""

    def __init__(self, analytics_repo: AnalyticsRepository, inactivity_timeout_seconds: int):
        self.analytics_repo = analytics_repo
        self.inactivity_timeout_seconds = inactivity_timeout_seconds

    def _is_connected(self, session: StudentExam, now: datetime) -> bool:
        """A session is live only if its timer is running and the client has
        sent a heartbeat within the inactivity timeout. Evaluated at read time
        so closed clients disappear without waiting for the background sweeper."""
        if session.paused_at is not None or session.last_activity_at is None:
            return False
        idle = (now - session.last_activity_at).total_seconds()
        return idle < self.inactivity_timeout_seconds

    def get_overview(self) -> AnalyticsOverviewResponse:
        scores = self.analytics_repo.get_score_summary()
        return AnalyticsOverviewResponse(
            pending_evaluations=self.analytics_repo.get_pending_evaluations_count(),
            average_score=scores["average_score"],
            pass_percentage=scores["pass_percentage"],
            highest_score=scores["highest_score"],
            lowest_score=scores["lowest_score"],
        )

    def get_student_overview(self) -> StudentOverviewResponse:
        total = self.analytics_repo.get_total_assignments()
        started = self.analytics_repo.get_started_count()
        counts = self.analytics_repo.get_assignment_status_counts()

        submitted = counts.get(AssignmentStatus.SUBMITTED.value, 0) + counts.get(
            AssignmentStatus.AUTO_SUBMITTED.value, 0
        )
        now = datetime.now(timezone.utc)
        unfinished = counts.get(AssignmentStatus.IN_PROGRESS.value, 0)
        live = sum(
            1 for s in self.analytics_repo.get_current_sessions() if self._is_connected(s, now)
        )
        return StudentOverviewResponse(
            total_assigned=total,
            started=started,
            submitted=submitted,
            in_progress=live,
            disconnected=max(unfinished - live, 0),
            not_started=total - started,
            expired=counts.get(AssignmentStatus.EXPIRED.value, 0),
            terminated=counts.get(AssignmentStatus.TERMINATED.value, 0),
        )

    def get_current_sessions(self) -> List[CurrentSessionResponse]:
        now = datetime.now(timezone.utc)
        sessions = self.analytics_repo.get_current_sessions()
        return [
            CurrentSessionResponse(
                id=session.id,
                studentName=session.student.name,
                rollNumber=session.student.roll_number,
                examName=_display_exam_name(session.exam_schedule.exam),
                subjectName=session.exam_schedule.exam.subject.name,
                startedAt=session.started_at,
                expiresAt=session.expires_at,
                lastActivityAt=session.last_activity_at,
                pausedAt=session.paused_at or (
                    session.last_activity_at if not self._is_connected(session, now) else None
                ),
                isConnected=self._is_connected(session, now),
            )
            for session in sessions
        ]

    def get_submission_status(self) -> List[SubmissionStatusCount]:
        counts = self.analytics_repo.get_assignment_status_counts()
        return [
            SubmissionStatusCount(
                status=status.value,
                count=counts.get(status.value, 0),
            )
            for status in _EXAM_DISPLAY_STATUSES
        ]

    def get_exam_performance(self) -> List[ExamPerformanceResponse]:
        rows = self.analytics_repo.get_exam_performance()
        return [
            ExamPerformanceResponse(
                id=row["id"],
                examName=row["title"] or row["subject_name"],
                averagePercentage=row["average_percentage"],
                submissions=row["submissions"],
            )
            for row in rows
        ]

    def get_pending_evaluations(self, limit: int = 10) -> List[PendingEvaluationResponse]:
        sessions = self.analytics_repo.get_pending_evaluations(limit=limit)
        return [
            PendingEvaluationResponse(
                id=session.id,
                studentName=session.student.name,
                rollNumber=session.student.roll_number,
                subjectName=session.exam_schedule.exam.subject.name,
                pendingAnswers=pending_count,
                submittedAt=session.submitted_at,
            )
            for session, pending_count in sessions
        ]
