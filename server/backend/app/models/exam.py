import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.question import Question
    from app.models.exam_schedule import ExamSchedule
    from app.models.subject import Subject


class Exam(BaseModel):
    __tablename__ = "exams"

    # Optional human-readable title; falls back to the subject name in the UI.
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    total_marks: Mapped[int] = mapped_column(Integer, nullable=False)

    # Foreign Key
    # RESTRICT: an Exam cannot be orphaned by deleting its creator.
    # The User must be deactivated or the exam reassigned first.
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    subject_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subjects.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    # Relationships
    creator: Mapped["User"] = relationship(
        "User",
        back_populates="created_exams",
    )

    subject: Mapped["Subject"] = relationship(
        "Subject",
        back_populates="exams",
    )

    questions: Mapped[List["Question"]] = relationship(
        "Question",
        back_populates="exam",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Question.display_order",
    )

    schedules: Mapped[List["ExamSchedule"]] = relationship(
        "ExamSchedule",
        back_populates="exam",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    @property
    def question_count(self) -> int:
        """Number of questions in this exam (lazy via the relationship).

        List/detail queries overwrite this with an aggregated COUNT through
        the setter to avoid per-exam lazy loads.
        """
        cached = getattr(self, "_question_count", None)
        return cached if cached is not None else len(self.questions)

    @question_count.setter
    def question_count(self, value: int) -> None:
        self._question_count = value
