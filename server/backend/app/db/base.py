import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, MetaData, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Naming convention ensures consistent, predictable constraint names
# across all tables. This is critical for Alembic migrations — without it,
# auto-generated names vary by database backend and become impossible to
# reference in downgrade scripts.
NAMING_CONVENTION: dict[str, str] = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy declarative models.

    Uses DeclarativeBase (SQLAlchemy 2.0) for native type hinting support.
    Attaches a MetaData with a naming convention so every constraint,
    index, and foreign key receives a deterministic, human-readable name.
    """

    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class BaseModel(Base):
    """
    Abstract base model that provides:

    - A UUID primary key (generated application-side via uuid4).
    - Timezone-aware created_at / updated_at timestamps.

    All domain models should inherit from BaseModel.
    """

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
