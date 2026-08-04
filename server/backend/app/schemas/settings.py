from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID


class SettingResponse(BaseModel):
    """A single system setting row returned to the client."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    key: str
    value: str | None
    category: str
    description: str | None
    created_at: datetime
    updated_at: datetime


class SettingsByCategoryResponse(BaseModel):
    """All settings grouped by category name."""
    categories: dict[str, list[SettingResponse]]


class UpdateSettingRequest(BaseModel):
    """Request body for updating a single setting."""
    value: str | None


class BulkUpdateSettingsRequest(BaseModel):
    """
    Request body for bulk-updating multiple settings at once.
    The 'settings' dict maps namespaced keys to their new values.
    Example: {"institution.name": "My College", "security.session_timeout_minutes": "60"}
    """
    settings: dict[str, str | None]
