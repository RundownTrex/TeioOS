from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from app.models.student_exam import StudentExam


class StudentExamRepository:
    """
    Data access layer for StudentExam entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_by_ids(self, student_id: UUID, exam_schedule_id: UUID) -> StudentExam | None:
        stmt = select(StudentExam).where(
            and_(
                StudentExam.student_id == student_id,
                StudentExam.exam_schedule_id == exam_schedule_id
            )
        )
        return self.session.execute(stmt).scalars().first()

    def get_all_for_schedule(self, exam_schedule_id: UUID, skip: int = 0, limit: int = 20) -> Sequence[StudentExam]:
        stmt = select(StudentExam).where(StudentExam.exam_schedule_id == exam_schedule_id).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count_for_schedule(self, exam_schedule_id: UUID) -> int:
        stmt = select(func.count()).select_from(StudentExam).where(StudentExam.exam_schedule_id == exam_schedule_id)
        return self.session.execute(stmt).scalar_one()

    def create(self, student_exam: StudentExam) -> StudentExam:
        self.session.add(student_exam)
        return student_exam

    def delete(self, student_exam: StudentExam) -> None:
        self.session.delete(student_exam)
