import uuid
import enum
from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, Enum as SAEnum, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.student import Student
    from app.models.exam_schedule import ExamSchedule
    from app.models.student_answer import StudentAnswer
    from app.models.result import Result


class AssignmentStatus(str, enum.Enum):
    """Tracks the lifecycle of a student's personal exam session."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    AUTO_SUBMITTED = "auto_submitted"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class StudentExam(BaseModel):
    """
    ExamAssignment — links a student to an exam schedule AND tracks the
    student's personal examination session (started_at, expires_at, etc.).
    """
    __tablename__ = "student_exams"

    # --- Session timestamps ---
    # When the student first started the exam (set once, never recomputed)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Individual session expiry (computed once: started_at + exam.duration)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # When the exam was submitted
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Updated on each server-authoritative interaction
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Set when the candidate leaves the exam: the individual timer is frozen
    # while paused_at is set and expires_at is shifted forward by the pause
    # duration when the session is resumed. NULL while the session is active.
    paused_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # --- Session state ---
    # native_enum=False so SQLAlchemy serializes/deserializes using the
    # enum's .value (lowercase) rather than the member name (uppercase),
    # matching the PostgreSQL assignmentstatus enum values.
    status: Mapped[AssignmentStatus] = mapped_column(
        SAEnum(
            AssignmentStatus,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            native_enum=False,
        ),
        default=AssignmentStatus.PENDING,
        nullable=False,
    )
    resume_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_auto_submitted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Per-student exam time override in minutes. NULL = use exam.duration_minutes.
    individual_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Foreign Keys
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    exam_schedule_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exam_schedules.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("student_id", "exam_schedule_id", name="uq_student_exam_schedule"),
        # Supports the server-side auto-submit sweep over expired sessions.
        Index("ix_student_exams_status_expires_at", "status", "expires_at"),
    )

    # Relationships
    student: Mapped["Student"] = relationship(
        "Student",
        back_populates="exam_assignments",
        overlaps="assigned_schedules,assigned_students",
    )

    exam_schedule: Mapped["ExamSchedule"] = relationship(
        "ExamSchedule",
        back_populates="student_exams",
        overlaps="assigned_students,assigned_schedules",
    )

    # StudentExam is the canonical owner of StudentAnswer lifecycle.
    answers: Mapped[List["StudentAnswer"]] = relationship(
        "StudentAnswer",
        back_populates="student_exam",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    result: Mapped["Result"] = relationship(
        "Result",
        back_populates="student_exam",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
