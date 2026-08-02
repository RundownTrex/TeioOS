from typing import Dict, Sequence, List
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.student_exam import StudentExam, AssignmentStatus
from app.models.student_answer import StudentAnswer
from app.models.question import Question, QuestionType
from app.models.exam import Exam
from app.models.exam_schedule import ExamSchedule
from app.models.subject import Subject
from app.models.result import Result

_SUBMITTED_STATUSES = [AssignmentStatus.SUBMITTED, AssignmentStatus.AUTO_SUBMITTED]


class AnalyticsRepository:
    """
    Data access layer for aggregated analytics and monitoring queries.
    Uses explicit SQL aggregations instead of Python-side counting so the
    stats stay correct at scale (see DashboardRepository for the same pattern).
    """

    def __init__(self, session: Session):
        self.session = session

    # --- Pending evaluations ---

    def get_pending_evaluations_count(self) -> int:
        """Number of submitted exam sessions that have at least one
        descriptive answer still awaiting manual evaluation."""
        stmt = (
            select(func.count(func.distinct(StudentAnswer.student_exam_id)))
            .join(Question, Question.id == StudentAnswer.question_id)
            .join(StudentExam, StudentExam.id == StudentAnswer.student_exam_id)
            .where(
                Question.question_type == QuestionType.DESCRIPTIVE,
                StudentAnswer.awarded_marks.is_(None),
                StudentExam.status.in_(_SUBMITTED_STATUSES),
            )
        )
        return self.session.execute(stmt).scalar_one()

    def get_pending_evaluations(self, limit: int = 10) -> List[tuple]:
        """Submitted exam sessions with unevaluated descriptive answers,
        most recently submitted first. Returns `(StudentExam, pending_count)`
        tuples so callers never lazy-load answer/question rows."""
        pending_counts = (
            select(
                StudentAnswer.student_exam_id,
                func.count(StudentAnswer.id).label("pending_count"),
            )
            .join(Question, Question.id == StudentAnswer.question_id)
            .where(
                Question.question_type == QuestionType.DESCRIPTIVE,
                StudentAnswer.awarded_marks.is_(None),
            )
            .group_by(StudentAnswer.student_exam_id)
            .subquery()
        )
        stmt = (
            select(StudentExam, pending_counts.c.pending_count)
            .join(pending_counts, pending_counts.c.student_exam_id == StudentExam.id)
            .where(StudentExam.status.in_(_SUBMITTED_STATUSES))
            .options(
                joinedload(StudentExam.student),
                joinedload(StudentExam.exam_schedule).joinedload(ExamSchedule.exam).joinedload(Exam.subject),
            )
            .order_by(StudentExam.submitted_at.desc())
            .limit(limit)
        )
        return list(self.session.execute(stmt).unique().all())

    # --- Student monitoring ---

    def get_total_assignments(self) -> int:
        stmt = select(func.count()).select_from(StudentExam)
        return self.session.execute(stmt).scalar_one()

    def get_started_count(self) -> int:
        stmt = select(func.count()).select_from(StudentExam).where(StudentExam.started_at.is_not(None))
        return self.session.execute(stmt).scalar_one()

    def get_assignment_status_counts(self) -> Dict[str, int]:
        stmt = (
            select(StudentExam.status, func.count(StudentExam.id))
            .group_by(StudentExam.status)
        )
        return {status.value: count for status, count in self.session.execute(stmt).all()}

    def get_current_sessions(self) -> Sequence[StudentExam]:
        stmt = (
            select(StudentExam)
            .options(
                joinedload(StudentExam.student),
                joinedload(StudentExam.exam_schedule).joinedload(ExamSchedule.exam).joinedload(Exam.subject),
            )
            .where(StudentExam.status == AssignmentStatus.IN_PROGRESS)
            .order_by(StudentExam.started_at.desc())
        )
        return self.session.execute(stmt).scalars().unique().all()

    # --- Exam performance ---

    def get_exam_performance(self) -> List[dict]:
        """Average percentage and submission count per exam, only for exams
        that already have results."""
        stmt = (
            select(
                Exam.id,
                Exam.title,
                Subject.name.label("subject_name"),
                func.avg(Result.percentage),
                func.count(Result.id),
            )
            .join(ExamSchedule, ExamSchedule.exam_id == Exam.id)
            .join(StudentExam, StudentExam.exam_schedule_id == ExamSchedule.id)
            .join(Result, Result.student_exam_id == StudentExam.id)
            .join(Subject, Subject.id == Exam.subject_id)
            .group_by(Exam.id, Exam.title, Subject.name)
            .order_by(Exam.title.asc().nulls_last(), Subject.name.asc())
        )
        rows = self.session.execute(stmt).all()
        return [
            {
                "id": exam_id,
                "title": title,
                "subject_name": subject_name,
                "average_percentage": round(float(avg_percentage), 2) if avg_percentage is not None else 0.0,
                "submissions": submissions,
            }
            for exam_id, title, subject_name, avg_percentage, submissions in rows
        ]
