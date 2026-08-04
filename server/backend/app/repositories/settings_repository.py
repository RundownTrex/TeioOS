from typing import Sequence
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.system_setting import SystemSetting


class SettingsRepository:
    """
    Data access layer for SystemSetting key-value store.
    Settings are accessed by key or by category for bulk reads/writes.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> Sequence[SystemSetting]:
        """Return all settings ordered by category then key."""
        stmt = select(SystemSetting).order_by(SystemSetting.category, SystemSetting.key)
        return self.session.execute(stmt).scalars().all()

    def get_by_category(self, category: str) -> Sequence[SystemSetting]:
        """Return all settings within a given category."""
        stmt = (
            select(SystemSetting)
            .where(SystemSetting.category == category)
            .order_by(SystemSetting.key)
        )
        return self.session.execute(stmt).scalars().all()

    def get_by_key(self, key: str) -> SystemSetting | None:
        """Return a single setting by its namespaced key."""
        stmt = select(SystemSetting).where(SystemSetting.key == key)
        return self.session.execute(stmt).scalars().first()

    def upsert(self, key: str, value: str | None, category: str = "general", description: str | None = None) -> SystemSetting:
        """
        Update an existing setting by key, or create it if it doesn't exist.
        Returns the updated or created SystemSetting row.
        """
        existing = self.get_by_key(key)
        if existing:
            existing.value = value
            return existing

        setting = SystemSetting(
            key=key,
            value=value,
            category=category,
            description=description,
        )
        self.session.add(setting)
        return setting

    def bulk_upsert(self, updates: dict[str, str | None]) -> Sequence[SystemSetting]:
        """
        Update multiple settings at once. Only updates existing keys —
        unknown keys are silently ignored for safety.
        Returns the updated settings.
        """
        updated = []
        for key, value in updates.items():
            existing = self.get_by_key(key)
            if existing:
                existing.value = value
                updated.append(existing)
        return updated
