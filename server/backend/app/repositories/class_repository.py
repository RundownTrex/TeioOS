from uuid import UUID
from sqlalchemy import select, and_
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
