from typing import Sequence
from sqlalchemy import select
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

    def get_all(self, skip: int = 0, limit: int = 20) -> Sequence[Student]:
        stmt = select(Student).order_by(Student.roll_number).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()
