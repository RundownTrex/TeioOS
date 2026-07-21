from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.option import Option


class OptionRepository:
    """
    Data access layer for Option entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, option_id: UUID) -> Option | None:
        stmt = select(Option).where(Option.id == option_id)
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20, question_id: UUID | None = None) -> Sequence[Option]:
        stmt = select(Option).order_by(Option.display_order)
        if question_id:
            stmt = stmt.where(Option.question_id == question_id)
        stmt = stmt.offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self, question_id: UUID | None = None) -> int:
        stmt = select(func.count()).select_from(Option)
        if question_id:
            stmt = stmt.where(Option.question_id == question_id)
        return self.session.execute(stmt).scalar_one()

    def get_correct_option_for_question(self, question_id: UUID) -> Option | None:
        """Fetch the currently correct option for a given question, if any."""
        stmt = select(Option).where(Option.question_id == question_id, Option.is_correct == True)
        return self.session.execute(stmt).scalars().first()

    def create(self, option: Option) -> Option:
        self.session.add(option)
        return option

    def update(self, option: Option) -> Option:
        # SQLAlchemy tracks changes automatically when flushed/committed.
        return option

    def delete(self, option: Option) -> None:
        self.session.delete(option)
