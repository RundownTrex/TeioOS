import uuid
import enum
from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.exam import Exam
    from app.models.student import Student
    from app.models.exam_session import ExamSession


class ExamScheduleStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ExamSchedule(BaseModel):
    __tablename__ = "exam_schedules"

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[ExamScheduleStatus] = mapped_column(
        SAEnum(ExamScheduleStatus), default=ExamScheduleStatus.SCHEDULED, nullable=False
    )

    # Foreign Key
    exam_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exams.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Relationships
    exam: Mapped["Exam"] = relationship(
        "Exam",
        back_populates="schedules",
    )

    # Many-to-Many via StudentExam
    assigned_students: Mapped[List["Student"]] = relationship(
        "Student",
        secondary="student_exams",
        back_populates="assigned_schedules",
    )

    # No ORM-level cascade here. The FK uses ondelete="RESTRICT", meaning the
    # database will block deletion of a schedule that has existing sessions.
    # An ORM cascade="all, delete-orphan" would contradict that intent.
    sessions: Mapped[List["ExamSession"]] = relationship(
        "ExamSession",
        back_populates="exam_schedule",
    )
