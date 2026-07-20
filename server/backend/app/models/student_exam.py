import uuid
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import BaseModel

class StudentExam(BaseModel):
    """
    Assignment table linking students to exam schedules.
    Many-to-Many resolution table.
    """
    __tablename__ = "student_exams"

    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), 
        index=True, 
        nullable=False
    )
    
    exam_schedule_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exam_schedules.id", ondelete="CASCADE"), 
        index=True, 
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint("student_id", "exam_schedule_id", name="uq_student_exam_schedule"),
    )
