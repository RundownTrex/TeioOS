import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.exam import Exam


class Subject(BaseModel):
    __tablename__ = "subjects"

    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    subject_code: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    
    # Foreign Key
    department_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"), 
        index=True, 
        nullable=False
    )

    # Relationships
    department: Mapped["Department"] = relationship(
        "Department", 
        back_populates="subjects"
    )
    
    exams: Mapped[List["Exam"]] = relationship(
        "Exam", 
        back_populates="subject",
        # Using passive_deletes allows RESTRICT logic at the DB level 
        # (by not loading all exams when deleting subject)
        passive_deletes=True
    )

    __table_args__ = (
        UniqueConstraint("department_id", "name", name="uq_subject_department_name"),
        UniqueConstraint("department_id", "subject_code", name="uq_subject_department_code"),
    )
