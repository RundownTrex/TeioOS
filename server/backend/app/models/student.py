import uuid
from datetime import date
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.class_ import Class
    from app.models.exam_schedule import ExamSchedule
    from app.models.student_exam import StudentExam


class Student(BaseModel):
    __tablename__ = "students"

    roll_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Foreign Key
    class_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("classes.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    # Relationships
    enrolled_class: Mapped["Class"] = relationship(
        "Class",
        back_populates="students",
    )

    # M:N relationship to ExamSchedule via student_exams
    assigned_schedules: Mapped[List["ExamSchedule"]] = relationship(
        "ExamSchedule",
        secondary="student_exams",
        back_populates="assigned_students",
        overlaps="exam_assignments,student_exams",
    )

    # Direct link to exam assignments (with session tracking)
    exam_assignments: Mapped[List["StudentExam"]] = relationship(
        "StudentExam",
        back_populates="student",
        overlaps="assigned_schedules",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
