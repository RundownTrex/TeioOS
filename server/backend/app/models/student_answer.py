import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Text, Float, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.exam_session import ExamSession
    from app.models.question import Question
    from app.models.option import Option
    from app.models.user import User


class StudentAnswer(BaseModel):
    __tablename__ = "student_answers"

    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    awarded_marks: Mapped[float | None] = mapped_column(Float, nullable=True)
    evaluator_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    evaluated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

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
    
    selected_option_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("options.id", ondelete="CASCADE"), 
        index=True, 
        nullable=True
    )

    evaluated_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint("exam_session_id", "question_id", name="uq_session_question_answer"),
        CheckConstraint("(selected_option_id IS NULL OR answer_text IS NULL)", name="ck_student_answers_choice_or_text"),
        CheckConstraint("awarded_marks IS NULL OR awarded_marks >= 0", name="ck_student_answers_awarded_marks_non_negative"),
    )

    # Relationships
    exam_session: Mapped["ExamSession"] = relationship("ExamSession", back_populates="answers")
    question: Mapped["Question"] = relationship("Question", back_populates="answers")
    selected_option: Mapped["Option | None"] = relationship("Option", back_populates="answers")
    evaluator: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[evaluated_by],
        back_populates="evaluated_answers",
    )

