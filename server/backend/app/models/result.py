import uuid
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.exam_session import ExamSession


class EvaluationStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIALLY_EVALUATED = "PARTIALLY_EVALUATED"
    COMPLETED = "COMPLETED"


class Result(BaseModel):
    __tablename__ = "results"

    # Pre-calculated marks to avoid runtime recalculations
    obtained_marks: Mapped[float] = mapped_column(Float, nullable=False)
    percentage: Mapped[float] = mapped_column(Float, nullable=False)
    grade: Mapped[str | None] = mapped_column(String(50), nullable=True)
    evaluation_status: Mapped[EvaluationStatus] = mapped_column(
        SAEnum(EvaluationStatus),
        default=EvaluationStatus.COMPLETED,
        nullable=False,
        index=True,
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Foreign Key — unique=True enforces the 1:1 relationship at the column level,
    # which is more idiomatic than a separate UniqueConstraint for single-column uniqueness.
    exam_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exam_sessions.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Relationships
    exam_session: Mapped["ExamSession"] = relationship(
        "ExamSession",
        back_populates="result",
    )

