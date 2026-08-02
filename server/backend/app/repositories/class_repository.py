from typing import Sequence
from uuid import UUID
from sqlalchemy import func, select, and_
from sqlalchemy.orm import Session

from app.models.class_ import Class
from app.repositories.base_repository import BaseRepository


class ClassRepository(BaseRepository[Class]):
    """
    Data access layer for Class entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        super().__init__(Class, session)

    def get_by_name_and_department(self, name: str, department_id: UUID) -> Class | None:
        stmt = select(Class).where(
            and_(Class.name == name, Class.department_id == department_id)
        )
        return self.session.execute(stmt).scalars().first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        q: str | None = None,
        department_id: UUID | None = None,
    ) -> Sequence[Class]:
        stmt = select(Class).order_by(Class.created_at.desc(), Class.id)
        if q:
            stmt = stmt.where(Class.name.ilike(f"%{q}%"))
        if department_id is not None:
            stmt = stmt.where(Class.department_id == department_id)
        stmt = stmt.offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self, q: str | None = None, department_id: UUID | None = None) -> int:
        stmt = select(func.count()).select_from(Class)
        if q:
            stmt = stmt.where(Class.name.ilike(f"%{q}%"))
        if department_id is not None:
            stmt = stmt.where(Class.department_id == department_id)
        return self.session.execute(stmt).scalar_one()
