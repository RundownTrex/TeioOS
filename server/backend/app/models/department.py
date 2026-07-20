from typing import List, TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.class_ import Class


class Department(BaseModel):
    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # Relationships
    # passive_deletes=True tells SQLAlchemy to let the database handle CASCADE
    # deletion instead of loading all children into memory to SET NULL / DELETE.
    classes: Mapped[List["Class"]] = relationship(
        "Class",
        back_populates="department",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
