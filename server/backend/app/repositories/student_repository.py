from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.student import Student


class StudentRepository:
    """
    Data access layer for Student entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, student_id: UUID) -> Student | None:
        stmt = select(Student).where(Student.id == student_id)
        return self.session.execute(stmt).scalars().first()

    def get_by_roll_number(self, roll_number: str) -> Student | None:
        stmt = select(Student).where(Student.roll_number == roll_number)
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20) -> Sequence[Student]:
        stmt = select(Student).order_by(Student.roll_number).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self) -> int:
        stmt = select(func.count()).select_from(Student)
        return self.session.execute(stmt).scalar_one()

    def create(self, student: Student) -> Student:
        self.session.add(student)
        return student

    def delete(self, student: Student) -> None:
        self.session.delete(student)
