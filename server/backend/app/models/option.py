import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import Text, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.question import Question
    from app.models.student_answer import StudentAnswer


class Option(BaseModel):
    __tablename__ = "options"

    option_text: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Foreign Key
    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Relationships
    question: Mapped["Question"] = relationship(
        "Question",
        back_populates="options",
    )

    # No delete-orphan here — StudentExam owns the orphan lifecycle of
    # StudentAnswer. passive_deletes lets the DB CASCADE handle cleanup.
    answers: Mapped[List["StudentAnswer"]] = relationship(
        "StudentAnswer",
        back_populates="selected_option",
        passive_deletes=True,
    )

    @validates("question")
    def validate_question(self, key: str, question: "Question | None") -> "Question | None":
        if question is not None:
            from app.models.question import QuestionType
            if question.question_type == QuestionType.DESCRIPTIVE:
                raise ValueError("Descriptive questions cannot have options.")
        return question

