from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.exam_schedule import ExamSchedule, ExamScheduleStatus
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.repositories.exam_repository import ExamRepository
from app.schemas.exam_schedule import ExamScheduleCreate, ExamScheduleUpdate
from app.schemas.pagination import PaginatedData
from app.core.exceptions import NotFoundException, ValidationException, ConflictException

class ExamScheduleService:
    def __init__(self, db: Session, schedule_repo: ExamScheduleRepository, exam_repo: ExamRepository):
        self.db = db
        self.schedule_repo = schedule_repo
        self.exam_repo = exam_repo

    def get_schedules(
        self,
        page: int,
        page_size: int,
        exam_id: UUID | None = None,
        search: str | None = None,
        status: str | None = None,
    ) -> PaginatedData[ExamSchedule]:
        skip = (page - 1) * page_size
        search_query = search.strip() if search else None
        items = self.schedule_repo.get_all(
            skip, page_size, exam_id=exam_id, search=search_query, status=status
        )
        total = self.schedule_repo.get_count(exam_id=exam_id, search=search_query, status=status)
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def get_schedule(self, schedule_id: UUID) -> ExamSchedule:
        schedule = self.schedule_repo.get_by_id(schedule_id)
        if not schedule:
            raise NotFoundException(resource_name="ExamSchedule")
        return schedule

    def _validate_exam(self, exam_id: UUID) -> None:
        exam = self.exam_repo.get_by_id(exam_id)
        if not exam:
            raise NotFoundException(resource_name="Exam")

    def _validate_times(self, start_time: datetime, end_time: datetime) -> None:
        if start_time >= end_time:
            raise ValidationException(detail="start_time must be strictly before end_time")

    def _check_overlap(self, exam_id: UUID, start_time: datetime, end_time: datetime, exclude_schedule_id: UUID | None = None) -> None:
        overlaps = self.schedule_repo.get_overlapping_schedules(exam_id, start_time, end_time, exclude_schedule_id)
        if overlaps:
            raise ConflictException(detail="This schedule overlaps with an existing schedule for the same exam.")

    def create_schedule(self, data: ExamScheduleCreate) -> ExamSchedule:
        self._validate_exam(data.exam_id)
        self._validate_times(data.start_time, data.end_time)
        self._check_overlap(data.exam_id, data.start_time, data.end_time)
        
        schedule = ExamSchedule(
            start_time=data.start_time,
            end_time=data.end_time,
            status=data.status,
            exam_id=data.exam_id
        )
        
        try:
            self.schedule_repo.create(schedule)
            self.db.commit()
            self.db.refresh(schedule)
            return schedule
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_schedule(self, schedule_id: UUID, data: ExamScheduleUpdate) -> ExamSchedule:
        schedule = self.get_schedule(schedule_id)
        
        # New values, fallback to current if not provided
        target_exam_id = data.exam_id if data.exam_id else schedule.exam_id
        target_start = data.start_time if data.start_time else schedule.start_time
        target_end = data.end_time if data.end_time else schedule.end_time
        
        # Validate Exam
        if data.exam_id and data.exam_id != schedule.exam_id:
            self._validate_exam(data.exam_id)
            
        # Validate Time bounds
        if data.start_time or data.end_time:
            self._validate_times(target_start, target_end)
            
        # Only check overlap if times or exam changed
        if data.start_time or data.end_time or data.exam_id:
            self._check_overlap(target_exam_id, target_start, target_end, exclude_schedule_id=schedule.id)
            
        # Apply updates
        if data.start_time:
            schedule.start_time = data.start_time
        if data.end_time:
            schedule.end_time = data.end_time
        if data.status:
            schedule.status = data.status
        if data.exam_id:
            schedule.exam_id = data.exam_id

        try:
            self.db.commit()
            self.db.refresh(schedule)
            return schedule
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def delete_schedule(self, schedule_id: UUID) -> None:
        schedule = self.get_schedule(schedule_id)
        try:
            self.schedule_repo.delete(schedule)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise
