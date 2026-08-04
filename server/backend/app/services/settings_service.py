from typing import Sequence
from sqlalchemy.orm import Session

from app.models.system_setting import SystemSetting
from app.repositories.settings_repository import SettingsRepository
from app.schemas.settings import SettingResponse, SettingsByCategoryResponse, BulkUpdateSettingsRequest


class SettingsService:
    """
    Business logic layer for System Settings.
    Delegates data access to SettingsRepository.
    Validates update payloads before persistence.
    """

    def __init__(self, db: Session):
        self.db = db
        self.repo = SettingsRepository(db)

    def get_all_settings(self) -> list[SettingResponse]:
        """Return all system settings as a flat list."""
        settings = self.repo.get_all()
        return [SettingResponse.model_validate(s) for s in settings]

    def get_settings_by_category(self, category: str) -> list[SettingResponse]:
        """Return all settings for a specific category."""
        settings = self.repo.get_by_category(category)
        return [SettingResponse.model_validate(s) for s in settings]

    def get_settings_grouped(self) -> SettingsByCategoryResponse:
        """
        Return all settings organised by category.
        Produces a structured dict keyed by category name.
        """
        all_settings = self.repo.get_all()
        grouped: dict[str, list[SettingResponse]] = {}
        for s in all_settings:
            cat = s.category
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(SettingResponse.model_validate(s))
        return SettingsByCategoryResponse(categories=grouped)

    def update_settings(self, updates: dict[str, str | None]) -> list[SettingResponse]:
        """
        Bulk-update settings from a key→value dict.
        Only existing keys are updated. Unknown keys are silently ignored.
        Commits the session after all updates.
        """
        updated = self.repo.bulk_upsert(updates)
        self.db.commit()
        return [SettingResponse.model_validate(s) for s in updated]

    def update_setting(self, key: str, value: str | None) -> SettingResponse:
        """Update a single setting by key."""
        setting = self.repo.upsert(key, value)
        self.db.commit()
        self.db.refresh(setting)
        return SettingResponse.model_validate(setting)
