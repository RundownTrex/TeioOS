import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import Text, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.exam import Exam
    from app.models.option import Option
    from app.models.student_answer import StudentAnswer


class Question(BaseModel):
    __tablename__ = "questions"

    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    marks: Mapped[float] = mapped_column(Float, nullable=False)
    negative_marks: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)

    # Foreign Key
    exam_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exams.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
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
