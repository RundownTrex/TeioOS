from typing import Sequence
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.exam_schedule import ExamSchedule, ExamScheduleStatus
from app.models.exam import Exam
from app.models.subject import Subject
from app.models.student_exam import StudentExam, AssignmentStatus
from app.repositories.base_repository import BaseRepository


class ExamScheduleRepository(BaseRepository[ExamSchedule]):
    """
    Data access layer for ExamSchedule entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    """

    def __init__(self, session: Session):
        super().__init__(ExamSchedule, session)

    def get_by_id_with_details(self, id: UUID) -> ExamSchedule | None:
        stmt = select(ExamSchedule).where(ExamSchedule.id == id).options(
            joinedload(ExamSchedule.exam)
            .joinedload(Exam.subject)
            .joinedload(Subject.department),
            joinedload(ExamSchedule.exam).selectinload(Exam.questions),
            joinedload(ExamSchedule.assigned_students)
        )
        return self.session.execute(stmt).scalars().first()

    def _apply_filters(
        self,
        stmt,
        exam_id: UUID | None = None,
        search: str | None = None,
        status: str | None = None,
    ):
        if exam_id:
            stmt = stmt.where(ExamSchedule.exam_id == exam_id)
        if status:
            stmt = stmt.where(ExamSchedule.status == status)
        if search:
            stmt = stmt.join(ExamSchedule.exam).where(Exam.title.ilike(f"%{search}%"))
        return stmt

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        exam_id: UUID | None = None,
        search: str | None = None,
        status: str | None = None,
    ) -> Sequence[ExamSchedule]:
        """Paginated schedules, newest start first, with an aggregated
        assigned-student count."""
        assigned_count_expr = (
            select(func.count(StudentExam.id))
            .where(StudentExam.exam_schedule_id == ExamSchedule.id)
            .correlate(ExamSchedule)
            .scalar_subquery()
        )
        stmt = select(ExamSchedule, assigned_count_expr.label("assigned_count"))
        stmt = self._apply_filters(stmt, exam_id=exam_id, search=search, status=status)
        stmt = stmt.order_by(ExamSchedule.start_time.desc(), ExamSchedule.id).offset(skip).limit(limit)

        rows = self.session.execute(stmt).all()
        schedules = []
        for schedule, assigned_count in rows:
            schedule.assigned_count = assigned_count
            schedules.append(schedule)
        return schedules

    def get_count(
        self,
        exam_id: UUID | None = None,
        search: str | None = None,
        status: str | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(ExamSchedule)
        stmt = self._apply_filters(stmt, exam_id=exam_id, search=search, status=status)
        return self.session.execute(stmt).scalar_one()

    def get_overlapping_schedules(
        self, 
        exam_id: UUID, 
        start_time: datetime, 
        end_time: datetime, 
        exclude_schedule_id: UUID | None = None
    ) -> Sequence[ExamSchedule]:
        """
        Returns any schedules for the given exam that overlap with the provided time window,
        excluding CANCELLED schedules.
        An overlap occurs if:
        (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
        """
        stmt = select(ExamSchedule).where(
            and_(
                ExamSchedule.exam_id == exam_id,
                ExamSchedule.status != ExamScheduleStatus.CANCELLED,
                ExamSchedule.start_time < end_time,
                ExamSchedule.end_time > start_time
            )
        )
        if exclude_schedule_id:
            stmt = stmt.where(ExamSchedule.id != exclude_schedule_id)
            
        return self.session.execute(stmt).scalars().all()

    def get_active_schedules_for_student_list(self, student_id: UUID) -> Sequence[ExamSchedule]:
        """
        Returns the exams assigned to a student that they can act on:
        - schedules currently inside the availability window (ACTIVE/SCHEDULED and not yet ended), or
        - schedules where the student already has a PENDING/IN_PROGRESS session, so that a
          candidate mid-examination can resume or submit even if the window has closed.
        """
        now = datetime.now(timezone.utc)
        has_running_assignment = (
            select(func.count())
            .select_from(StudentExam)
            .where(
                StudentExam.student_id == student_id,
                StudentExam.exam_schedule_id == ExamSchedule.id,
                StudentExam.status.in_([AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS]),
            )
            .scalar_subquery()
            > 0
        )
        stmt = select(ExamSchedule).where(
            and_(
                ExamSchedule.assigned_students.any(id=student_id),
                or_(
                    and_(
                        ExamSchedule.status.in_([ExamScheduleStatus.ACTIVE, ExamScheduleStatus.SCHEDULED]),
                        ExamSchedule.end_time >= now,
                    ),
                    has_running_assignment,
                ),
            )
        ).options(
            joinedload(ExamSchedule.exam)
            .joinedload(Exam.subject)
            .joinedload(Subject.department)
        )
        return self.session.execute(stmt).scalars().all()
