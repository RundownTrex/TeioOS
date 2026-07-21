import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.exam_session import ExamSession, SessionStatus
from app.repositories.base import BaseRepository


class SessionRepository(BaseRepository[ExamSession, Any, Any]):
    def __init__(self, db: Session):
        super().__init__(ExamSession, db)

    def get_or_create_session(self, student_id: uuid.UUID, schedule_id: uuid.UUID) -> ExamSession:
        """
        Retrieves an existing exam session for the student and schedule, or creates a new one.
        Updates the login_time to current time.

        Does NOT commit — the caller owns the transaction boundary.
        """
        stmt = select(ExamSession).where(
            ExamSession.student_id == student_id,
            ExamSession.exam_schedule_id == schedule_id,
        )

        session = self.db.scalars(stmt).first()
        now = datetime.now(timezone.utc)

        if not session:
            # Create a new session tracking their attempt
            session = ExamSession(
                student_id=student_id,
                exam_schedule_id=schedule_id,
                status=SessionStatus.IN_PROGRESS,
                login_time=now,
                start_time=now,  # They start immediately upon login in kiosk mode
                is_auto_submitted=False,
            )
            self.db.add(session)
            self.db.flush()
        else:
            # They are reconnecting, just update login_time
            session.login_time = now
            if session.status == SessionStatus.PENDING:
                session.status = SessionStatus.IN_PROGRESS
                if not session.start_time:
                    session.start_time = now
            self.db.add(session)
            self.db.flush()

        return session
