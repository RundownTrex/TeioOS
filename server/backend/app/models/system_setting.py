import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import BaseModel


class SystemSetting(BaseModel):
    """
    Generic key-value store for system configuration.

    Each row holds one setting identified by a dot-namespaced key
    (e.g. 'institution.name', 'security.password_min_length').
    This schema is intentionally simple: extensibility comes from
    adding new keys — not new columns — keeping migrations minimal.
    """

    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True, default="general")
    description: Mapped[str | None] = mapped_column(String(256), nullable=True)
