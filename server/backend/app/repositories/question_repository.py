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

    def _apply_filters(
        self,
        stmt,
        exam_id: UUID | None = None,
        search: str | None = None,
        question_type: str | None = None,
    ):
        if exam_id:
            stmt = stmt.where(Question.exam_id == exam_id)
        if question_type:
            stmt = stmt.where(Question.question_type == question_type)
        if search:
            stmt = stmt.where(Question.question_text.ilike(f"%{search}%"))
        return stmt

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        exam_id: UUID | None = None,
        search: str | None = None,
        question_type: str | None = None,
    ) -> Sequence[Question]:
        stmt = select(Question).options(joinedload(Question.options)).order_by(Question.display_order)
        stmt = self._apply_filters(stmt, exam_id=exam_id, search=search, question_type=question_type)
        stmt = stmt.offset(skip).limit(limit)
        return self.session.execute(stmt).unique().scalars().all()

    def get_count(
        self,
        exam_id: UUID | None = None,
        search: str | None = None,
        question_type: str | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(Question)
        stmt = self._apply_filters(stmt, exam_id=exam_id, search=search, question_type=question_type)
        return self.session.execute(stmt).scalar_one()

    def get_max_display_order(self, exam_id: UUID) -> int | None:
        """Highest display_order among an exam's questions (None when empty)."""
        stmt = select(func.max(Question.display_order)).where(Question.exam_id == exam_id)
        return self.session.execute(stmt).scalar_one()
