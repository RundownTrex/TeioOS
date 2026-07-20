import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.exam_session import ExamSession
    from app.models.question import Question
    from app.models.option import Option

class StudentAnswer(BaseModel):
    __tablename__ = "student_answers"

    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Foreign Keys
    exam_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exam_sessions.id", ondelete="CASCADE"), 
        index=True, 
        nullable=False
    )
    
    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), 
        index=True, 
        nullable=False
    )
    
    selected_option_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("options.id", ondelete="CASCADE"), 
        index=True, 
        nullable=False
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint("exam_session_id", "question_id", name="uq_session_question_answer"),
    )

    # Relationships
    exam_session: Mapped["ExamSession"] = relationship("ExamSession", back_populates="answers")
    question: Mapped["Question"] = relationship("Question", back_populates="answers")
    selected_option: Mapped["Option"] = relationship("Option", back_populates="answers")
