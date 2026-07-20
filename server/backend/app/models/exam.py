import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.question import Question
    from app.models.exam_schedule import ExamSchedule


class Exam(BaseModel):
    __tablename__ = "exams"

    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
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

    # Relationships
    creator: Mapped["User"] = relationship(
        "User",
        back_populates="created_exams",
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
