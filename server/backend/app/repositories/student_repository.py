from typing import Sequence
from uuid import UUID
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.student import Student
from app.repositories.base_repository import BaseRepository


class StudentRepository(BaseRepository[Student]):
    """
    Data access layer for Student entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        super().__init__(Student, session)

    def get_by_roll_number(self, roll_number: str) -> Student | None:
        stmt = select(Student).where(Student.roll_number == roll_number)
        return self.session.execute(stmt).scalars().first()

    def get_active_by_class(self, class_id: UUID) -> Sequence[Student]:
        """All active students of a class, ordered by roll number. Used for
        bulk class assignment to exam schedules."""
        stmt = select(Student).where(
            Student.class_id == class_id,
            Student.is_active.is_(True),
        ).order_by(Student.roll_number)
        return self.session.execute(stmt).scalars().all()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        q: str | None = None,
        class_id: UUID | None = None,
        is_active: bool | None = None,
    ) -> Sequence[Student]:
        stmt = select(Student).order_by(Student.roll_number)
        stmt = self._apply_filters(stmt, q, class_id, is_active)
        stmt = stmt.offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self, q: str | None = None, class_id: UUID | None = None, is_active: bool | None = None) -> int:
        stmt = select(func.count()).select_from(Student)
        stmt = self._apply_filters(stmt, q, class_id, is_active)
        return self.session.execute(stmt).scalar_one()

    def _apply_filters(self, stmt, q: str | None, class_id: UUID | None, is_active: bool | None):
        if q:
            stmt = stmt.where(
                or_(
                    Student.name.ilike(f"%{q}%"),
                    Student.roll_number.ilike(f"%{q}%"),
                )
            )
        if class_id is not None:
            stmt = stmt.where(Student.class_id == class_id)
        if is_active is not None:
            stmt = stmt.where(Student.is_active == is_active)
        return stmt
