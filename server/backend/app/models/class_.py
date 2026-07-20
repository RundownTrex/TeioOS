import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.student import Student

class Class(BaseModel):
    __tablename__ = "classes"

    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    section: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Foreign Key
    department_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"), 
        index=True, 
        nullable=False
    )

    # Relationships
    department: Mapped["Department"] = relationship(
        "Department", 
        back_populates="classes"
    )
    
    students: Mapped[List["Student"]] = relationship(
        "Student", 
        back_populates="enrolled_class",
        cascade="all, delete-orphan"
    )
