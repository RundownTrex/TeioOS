from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.department import Department


class DepartmentRepository:
    """
    Data access layer for Department entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, department_id: UUID) -> Department | None:
        stmt = select(Department).where(Department.id == department_id)
        return self.session.execute(stmt).scalars().first()

    def get_by_name(self, name: str) -> Department | None:
        stmt = select(Department).where(Department.name == name)
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20) -> Sequence[Department]:
        stmt = select(Department).order_by(Department.name).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self) -> int:
        stmt = select(func.count()).select_from(Department)
        return self.session.execute(stmt).scalar_one()

    def create(self, department: Department) -> Department:
        self.session.add(department)
        return department

    def delete(self, department: Department) -> None:
        self.session.delete(department)
