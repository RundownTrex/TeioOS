import uuid
from typing import Sequence
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, joinedload

from app.models.student_exam import StudentExam, AssignmentStatus
from app.models.exam_schedule import ExamSchedule
from app.models.exam import Exam
from app.models.subject import Subject
from app.repositories.base_repository import BaseRepository


class StudentExamRepository(BaseRepository[StudentExam]):
    """
    Data access layer for StudentExam entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    """

    def __init__(self, session: Session):
        super().__init__(StudentExam, session)

    def get_by_ids(self, student_id: UUID, exam_schedule_id: UUID) -> StudentExam | None:
        stmt = select(StudentExam).where(
            and_(
                StudentExam.student_id == student_id,
                StudentExam.exam_schedule_id == exam_schedule_id
            )
        )
        return self.session.execute(stmt).scalars().first()

    def get_by_student_and_schedule(self, student_id: uuid.UUID, schedule_id: uuid.UUID) -> StudentExam | None:
        """Retrieves the exam assignment (which tracks the session) for a student and schedule."""
        stmt = select(StudentExam).where(
            StudentExam.student_id == student_id,
            StudentExam.exam_schedule_id == schedule_id,
        )
        return self.session.scalars(stmt).first()

    def get_by_student_and_schedules(
        self, student_id: uuid.UUID, schedule_ids: Sequence[uuid.UUID]
    ) -> Sequence[StudentExam]:
        """Retrieves all exam assignments for a student across the given schedules."""
        if not schedule_ids:
            return []
        stmt = select(StudentExam).where(
            StudentExam.student_id == student_id,
            StudentExam.exam_schedule_id.in_(schedule_ids),
        )
        return self.session.scalars(stmt).all()

    def get_by_id_with_schedule(self, id: uuid.UUID) -> StudentExam | None:
        """Eager-loads the exam_schedule and exam for session validation."""
        stmt = select(StudentExam).options(
            joinedload(StudentExam.exam_schedule).joinedload(ExamSchedule.exam)
        ).where(StudentExam.id == id)
        return self.session.scalars(stmt).first()

    def get_in_progress_expired(self, now: datetime, limit: int = 200) -> Sequence[StudentExam]:
        """
        Returns started sessions whose individual timer has elapsed and which have
        not yet been submitted (AUTO_SUBMITTED / SUBMITTED rows are excluded).
        Paused sessions are excluded: their timer is frozen and the deadline is
        shifted forward when the candidate resumes.

        Rows are locked with FOR UPDATE SKIP LOCKED so a concurrent sweeper and
        lazy expiry guards cannot process the same row twice.
        """
        stmt = select(StudentExam).where(
            StudentExam.status.in_([AssignmentStatus.IN_PROGRESS, AssignmentStatus.EXPIRED]),
            StudentExam.expires_at.is_not(None),
            StudentExam.expires_at <= now,
            StudentExam.submitted_at.is_(None),
            StudentExam.paused_at.is_(None),
        ).order_by(StudentExam.expires_at).limit(limit).with_for_update(skip_locked=True)
        return self.session.scalars(stmt).all()

    def get_in_progress_inactive(self, now: datetime, inactivity_timeout_seconds: int, limit: int = 200) -> Sequence[StudentExam]:
        """
        Returns active (non-paused) sessions whose last server-authoritative
        activity predates the inactivity timeout. These sessions are paused by
        the sweeper as a fallback when the client could not signal a pause
        itself (browser crash, network loss, power failure).

        Rows are locked with FOR UPDATE SKIP LOCKED so concurrent sweepers
        cannot process the same row twice.
        """
        stmt = select(StudentExam).where(
            StudentExam.status == AssignmentStatus.IN_PROGRESS,
            StudentExam.expires_at.is_not(None),
            StudentExam.submitted_at.is_(None),
            StudentExam.paused_at.is_(None),
            StudentExam.last_activity_at.is_not(None),
            StudentExam.last_activity_at <= now - timedelta(seconds=inactivity_timeout_seconds),
        ).order_by(StudentExam.last_activity_at).limit(limit).with_for_update(skip_locked=True)
        return self.session.scalars(stmt).all()

    def get_paused_overdue(self, now: datetime, max_pause_minutes: int, limit: int = 200) -> Sequence[StudentExam]:
        """
        Returns paused sessions that have been paused longer than the maximum
        allowed pause duration. These are auto-submitted as a safety net so an
        abandoned exam still produces a result.

        Rows are locked with FOR UPDATE SKIP LOCKED so concurrent sweepers
        cannot process the same row twice.
        """
        stmt = select(StudentExam).where(
            StudentExam.status == AssignmentStatus.IN_PROGRESS,
            StudentExam.submitted_at.is_(None),
            StudentExam.paused_at.is_not(None),
            StudentExam.paused_at <= now - timedelta(minutes=max_pause_minutes),
        ).order_by(StudentExam.paused_at).limit(limit).with_for_update(skip_locked=True)
        return self.session.scalars(stmt).all()

    def get_all_for_schedule(self, exam_schedule_id: UUID, skip: int = 0, limit: int = 20) -> Sequence[StudentExam]:
        stmt = select(StudentExam).where(StudentExam.exam_schedule_id == exam_schedule_id).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count_for_schedule(self, exam_schedule_id: UUID) -> int:
        stmt = select(func.count()).select_from(StudentExam).where(StudentExam.exam_schedule_id == exam_schedule_id)
        return self.session.execute(stmt).scalar_one()
