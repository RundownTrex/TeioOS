from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from app.models.class_ import Class


class ClassRepository:
    """
    Data access layer for Class entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, class_id: UUID) -> Class | None:
        stmt = select(Class).where(Class.id == class_id)
        return self.session.execute(stmt).scalars().first()

    def get_by_name_and_department(self, name: str, department_id: UUID) -> Class | None:
        stmt = select(Class).where(
            and_(Class.name == name, Class.department_id == department_id)
        )
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20) -> Sequence[Class]:
        stmt = select(Class).order_by(Class.name).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self) -> int:
        stmt = select(func.count()).select_from(Class)
        return self.session.execute(stmt).scalar_one()

    def create(self, class_obj: Class) -> Class:
        self.session.add(class_obj)
        return class_obj

    def delete(self, class_obj: Class) -> None:
        self.session.delete(class_obj)
