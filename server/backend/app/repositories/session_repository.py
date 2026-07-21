import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.exam_session import ExamSession
from app.repositories.base_repository import BaseRepository

class SessionRepository(BaseRepository[ExamSession]):
    def __init__(self, session: Session):
        super().__init__(ExamSession, session)

    def get_by_student_and_schedule(self, student_id: uuid.UUID, schedule_id: uuid.UUID) -> ExamSession | None:
        """Retrieves an existing exam session for the student and schedule."""
        stmt = select(ExamSession).where(
            ExamSession.student_id == student_id,
            ExamSession.exam_schedule_id == schedule_id,
        )
        return self.session.scalars(stmt).first()
