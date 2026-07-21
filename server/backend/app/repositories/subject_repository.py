from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.repositories.base_repository import BaseRepository


class SubjectRepository(BaseRepository[Subject]):
    """
    Data access layer for Subject entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        super().__init__(Subject, session)

    def get_by_department_and_name(self, department_id: UUID, name: str) -> Subject | None:
        stmt = select(Subject).where(
            Subject.department_id == department_id,
            Subject.name == name
        )
        return self.session.execute(stmt).scalars().first()

    def get_by_department_and_code(self, department_id: UUID, subject_code: str) -> Subject | None:
        stmt = select(Subject).where(
            Subject.department_id == department_id,
            Subject.subject_code == subject_code
        )
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20) -> Sequence[Subject]:
        stmt = select(Subject).order_by(Subject.name).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_by_department(self, department_id: UUID, skip: int = 0, limit: int = 20) -> Sequence[Subject]:
        stmt = select(Subject).where(Subject.department_id == department_id).order_by(Subject.name).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count_by_department(self, department_id: UUID) -> int:
        stmt = select(func.count()).select_from(Subject).where(Subject.department_id == department_id)
        return self.session.execute(stmt).scalar_one()
