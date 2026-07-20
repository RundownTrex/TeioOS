import uuid
import enum
from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.student import Student
    from app.models.exam_schedule import ExamSchedule
    from app.models.student_answer import StudentAnswer
    from app.models.result import Result


class SessionStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class ExamSession(BaseModel):
    __tablename__ = "exam_sessions"

    login_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    start_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submit_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[SessionStatus] = mapped_column(
        SAEnum(SessionStatus), default=SessionStatus.PENDING, nullable=False
    )

    machine_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_auto_submitted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Foreign Keys
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    exam_schedule_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exam_schedules.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("student_id", "exam_schedule_id", name="uq_student_exam_session"),
    )

    # Relationships
    student: Mapped["Student"] = relationship(
        "Student",
        back_populates="exam_sessions",
    )

    exam_schedule: Mapped["ExamSchedule"] = relationship(
        "ExamSchedule",
        back_populates="sessions",
    )

    # ExamSession is the canonical owner of StudentAnswer lifecycle.
    # Only this relationship uses delete-orphan.
    answers: Mapped[List["StudentAnswer"]] = relationship(
        "StudentAnswer",
        back_populates="exam_session",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    result: Mapped["Result"] = relationship(
        "Result",
        back_populates="exam_session",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
