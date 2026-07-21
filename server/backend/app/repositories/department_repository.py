from typing import Sequence
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.repositories.base_repository import BaseRepository


class DepartmentRepository(BaseRepository[Department]):
    """
    Data access layer for Department entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        super().__init__(Department, session)

    def get_by_name(self, name: str) -> Department | None:
        stmt = select(Department).where(Department.name == name)
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20) -> Sequence[Department]:
        stmt = select(Department).order_by(Department.name).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()
