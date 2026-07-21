from typing import Sequence
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session

from app.models.exam_schedule import ExamSchedule, ExamScheduleStatus


class ExamScheduleRepository:
    """
    Data access layer for ExamSchedule entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, schedule_id: UUID) -> ExamSchedule | None:
        stmt = select(ExamSchedule).where(ExamSchedule.id == schedule_id)
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20, exam_id: UUID | None = None) -> Sequence[ExamSchedule]:
        stmt = select(ExamSchedule).order_by(ExamSchedule.start_time.desc())
        if exam_id:
            stmt = stmt.where(ExamSchedule.exam_id == exam_id)
        stmt = stmt.offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self, exam_id: UUID | None = None) -> int:
        stmt = select(func.count()).select_from(ExamSchedule)
        if exam_id:
            stmt = stmt.where(ExamSchedule.exam_id == exam_id)
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

    def create(self, schedule: ExamSchedule) -> ExamSchedule:
        self.session.add(schedule)
        return schedule

    def delete(self, schedule: ExamSchedule) -> None:
        self.session.delete(schedule)
