from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.question import Question
from app.repositories.base_repository import BaseRepository


class QuestionRepository(BaseRepository[Question]):
    """
    Data access layer for Question entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    """

    def __init__(self, session: Session):
        super().__init__(Question, session)

    def get_by_id(self, question_id: UUID) -> Question | None:
        stmt = select(Question).options(joinedload(Question.options)).where(Question.id == question_id)
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20, exam_id: UUID | None = None) -> Sequence[Question]:
        stmt = select(Question).options(joinedload(Question.options)).order_by(Question.display_order)
        if exam_id:
            stmt = stmt.where(Question.exam_id == exam_id)
        stmt = stmt.offset(skip).limit(limit)
        return self.session.execute(stmt).unique().scalars().all()

    def get_count(self, exam_id: UUID | None = None) -> int:
        if not exam_id:
            return super().get_count()
        stmt = select(func.count()).select_from(Question).where(Question.exam_id == exam_id)
        return self.session.execute(stmt).scalar_one()

    def get_max_display_order(self, exam_id: UUID) -> int | None:
        """Highest display_order among an exam's questions (None when empty)."""
        stmt = select(func.max(Question.display_order)).where(Question.exam_id == exam_id)
        return self.session.execute(stmt).scalar_one()
