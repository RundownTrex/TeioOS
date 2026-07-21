from sqlalchemy.orm import Session

from app.models.exam import Exam
from app.repositories.base_repository import BaseRepository


class ExamRepository(BaseRepository[Exam]):
    """
    Data access layer for Exam entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        super().__init__(Exam, session)
