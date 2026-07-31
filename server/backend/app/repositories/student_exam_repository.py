import uuid
from typing import Sequence
from uuid import UUID
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

    def get_by_id_with_schedule(self, id: uuid.UUID) -> StudentExam | None:
        """Eager-loads the exam_schedule and exam for session validation."""
        stmt = select(StudentExam).options(
            joinedload(StudentExam.exam_schedule).joinedload(ExamSchedule.exam)
        ).where(StudentExam.id == id)
        return self.session.scalars(stmt).first()

    def get_all_for_schedule(self, exam_schedule_id: UUID, skip: int = 0, limit: int = 20) -> Sequence[StudentExam]:
        stmt = select(StudentExam).where(StudentExam.exam_schedule_id == exam_schedule_id).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count_for_schedule(self, exam_schedule_id: UUID) -> int:
        stmt = select(func.count()).select_from(StudentExam).where(StudentExam.exam_schedule_id == exam_schedule_id)
        return self.session.execute(stmt).scalar_one()
