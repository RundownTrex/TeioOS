import enum
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.exam import Exam
    from app.models.student_answer import StudentAnswer

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"

class User(BaseModel):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)

    # Relationships
    created_exams: Mapped[List["Exam"]] = relationship(
        "Exam", 
        back_populates="creator"
    )

    evaluated_answers: Mapped[List["StudentAnswer"]] = relationship(
        "StudentAnswer",
        back_populates="evaluator",
        foreign_keys="[StudentAnswer.evaluated_by]",
    )

