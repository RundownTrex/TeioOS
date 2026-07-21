from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.exam import Exam


class ExamRepository:
    """
    Data access layer for Exam entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, exam_id: UUID) -> Exam | None:
        stmt = select(Exam).where(Exam.id == exam_id)
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20) -> Sequence[Exam]:
        stmt = select(Exam).order_by(Exam.title).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self) -> int:
        stmt = select(func.count()).select_from(Exam)
        return self.session.execute(stmt).scalar_one()

    def create(self, exam: Exam) -> Exam:
        self.session.add(exam)
        return exam

    def delete(self, exam: Exam) -> None:
        self.session.delete(exam)
