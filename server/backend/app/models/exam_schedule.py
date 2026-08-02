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
    from app.models.student_exam import StudentExam


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
        overlaps="exam_assignments,student_exams",
    )

    # Direct link to exam assignments (with session tracking)
    student_exams: Mapped[List["StudentExam"]] = relationship(
        "StudentExam",
        back_populates="exam_schedule",
        overlaps="assigned_students,assigned_schedules",
    )

    @property
    def assigned_count(self) -> int:
        """Number of students assigned to this schedule (lazy via the
        relationship). List queries overwrite this with an aggregated COUNT
        through the setter to avoid per-schedule lazy loads."""
        cached = getattr(self, "_assigned_count", None)
        return cached if cached is not None else len(self.student_exams)

    @assigned_count.setter
    def assigned_count(self, value: int) -> None:
        self._assigned_count = value
