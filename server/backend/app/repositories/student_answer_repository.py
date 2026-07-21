import uuid
from typing import Sequence
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime, timezone

from app.models.student_answer import StudentAnswer
from app.repositories.base_repository import BaseRepository

class StudentAnswerRepository(BaseRepository[StudentAnswer]):
    def __init__(self, session: Session):
        super().__init__(StudentAnswer, session)

    def get_by_session_and_question(self, session_id: uuid.UUID, question_id: uuid.UUID) -> StudentAnswer | None:
        stmt = select(StudentAnswer).where(
            StudentAnswer.exam_session_id == session_id,
            StudentAnswer.question_id == question_id,
        )
        return self.session.scalars(stmt).first()

    def get_all_by_session(self, session_id: uuid.UUID) -> Sequence[StudentAnswer]:
        stmt = select(StudentAnswer).where(StudentAnswer.exam_session_id == session_id)
        return self.session.scalars(stmt).all()

    def upsert_answer(self, session_id: uuid.UUID, question_id: uuid.UUID, option_id: uuid.UUID) -> None:
        """
        True PostgreSQL UPSERT.
        Insert the new answer. On constraint violation (uq_session_question_answer),
        update the selected_option_id and answered_at fields so the last answer wins.
        """
        stmt = insert(StudentAnswer).values(
            id=uuid.uuid4(),
            exam_session_id=session_id,
            question_id=question_id,
            selected_option_id=option_id,
            answered_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        # On conflict (a row with the same session_id + question_id exists), update it
        stmt = stmt.on_conflict_do_update(
            constraint="uq_session_question_answer",
            set_=dict(
                selected_option_id=stmt.excluded.selected_option_id,
                answered_at=stmt.excluded.answered_at,
                updated_at=datetime.now(timezone.utc)
            )
        )
        
        self.session.execute(stmt)
