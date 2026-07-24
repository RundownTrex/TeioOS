import uuid
import enum
from typing import List, TYPE_CHECKING
from sqlalchemy import Text, Float, Integer, ForeignKey, Enum as SAEnum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.exam import Exam
    from app.models.option import Option
    from app.models.student_answer import StudentAnswer


class QuestionType(str, enum.Enum):
    MCQ = "MCQ"
    DESCRIPTIVE = "DESCRIPTIVE"


class Question(BaseModel):
    __tablename__ = "questions"

    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(
        SAEnum(QuestionType),
        default=QuestionType.MCQ,
        nullable=False,
        index=True,
    )
    marks: Mapped[float] = mapped_column(Float, nullable=False)
    negative_marks: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    max_characters: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Foreign Key
    exam_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exams.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Constraints
    __table_args__ = (
        CheckConstraint("max_characters IS NULL OR max_characters > 0", name="ck_questions_max_characters_positive"),
        CheckConstraint("question_type != 'MCQ' OR max_characters IS NULL", name="ck_questions_mcq_no_max_chars"),
    )

    # Relationships
    exam: Mapped["Exam"] = relationship(
        "Exam",
        back_populates="questions",
    )

    options: Mapped[List["Option"]] = relationship(
        "Option",
        back_populates="question",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Option.display_order",
    )

    # No delete-orphan here — ExamSession owns the orphan lifecycle of
    # StudentAnswer. Using passive_deletes lets the DB CASCADE handle cleanup
    # if a Question is deleted directly.
    answers: Mapped[List["StudentAnswer"]] = relationship(
        "StudentAnswer",
        back_populates="question",
        passive_deletes=True,
    )

