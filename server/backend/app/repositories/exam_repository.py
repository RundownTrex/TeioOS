from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.exam import Exam
from app.models.question import Question
from app.repositories.base_repository import BaseRepository


class ExamRepository(BaseRepository[Exam]):
    """
    Data access layer for Exam entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        super().__init__(Exam, session)

    def get_all(self, skip: int = 0, limit: int = 20, subject_id: UUID | None = None) -> Sequence[Exam]:
        """Paginated exams, newest first, with an aggregated question count."""
        question_count_expr = (
            select(func.count(Question.id))
            .where(Question.exam_id == Exam.id)
            .correlate(Exam)
            .scalar_subquery()
        )
        stmt = select(Exam, question_count_expr.label("question_count"))
        if subject_id:
            stmt = stmt.where(Exam.subject_id == subject_id)
        stmt = stmt.order_by(Exam.created_at.desc(), Exam.id).offset(skip).limit(limit)

        rows = self.session.execute(stmt).all()
        exams = []
        for exam, question_count in rows:
            exam.question_count = question_count
            exams.append(exam)
        return exams

    def get_by_id(self, exam_id: UUID) -> Exam | None:
        exam = super().get_by_id(exam_id)
        if exam:
            exam.question_count = self.get_question_count(exam_id)
        return exam

    def get_question_count(self, exam_id: UUID) -> int:
        stmt = select(func.count(Question.id)).where(Question.exam_id == exam_id)
        return self.session.execute(stmt).scalar_one()
