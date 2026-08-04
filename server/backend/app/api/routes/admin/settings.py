from typing import List
from fastapi import APIRouter, Depends

from app.api.dependencies.auth import require_admin_only
from app.api.dependencies.database import SessionDep
from app.schemas.settings import (
    SettingResponse,
    SettingsByCategoryResponse,
    UpdateSettingRequest,
    BulkUpdateSettingsRequest,
)
from app.schemas.response import APIResponse
from app.services.settings_service import SettingsService

router = APIRouter()


def get_settings_service(db: SessionDep) -> SettingsService:
    return SettingsService(db)


@router.get("/", response_model=APIResponse[SettingsByCategoryResponse])
def get_all_settings(
    db: SessionDep,
    _=Depends(require_admin_only),
):
    """
    Return all system settings grouped by category.
    Used by the Settings page to populate all sections at once.
    """
    service = get_settings_service(db)
    data = service.get_settings_grouped()
    return APIResponse(
        success=True,
        message="System settings retrieved successfully",
        data=data,
    )


@router.get("/{category}", response_model=APIResponse[List[SettingResponse]])
def get_settings_by_category(
    category: str,
    db: SessionDep,
    _=Depends(require_admin_only),
):
    """Return all settings for a specific category (e.g. 'institution', 'security')."""
    service = get_settings_service(db)
    data = service.get_settings_by_category(category)
    return APIResponse(
        success=True,
        message=f"Settings for category '{category}' retrieved successfully",
        data=data,
    )


@router.patch("/", response_model=APIResponse[List[SettingResponse]])
def bulk_update_settings(
    body: BulkUpdateSettingsRequest,
    db: SessionDep,
    _=Depends(require_admin_only),
):
    """
    Bulk-update multiple settings in a single request.
    Only known keys are updated; unknown keys are silently ignored.
    """
    service = get_settings_service(db)
    updated = service.update_settings(body.settings)
    return APIResponse(
        success=True,
        message=f"{len(updated)} setting(s) updated successfully",
        data=updated,
    )


@router.patch("/{key:path}", response_model=APIResponse[SettingResponse])
def update_setting(
    key: str,
    body: UpdateSettingRequest,
    db: SessionDep,
    _=Depends(require_admin_only),
):
    """Update a single setting by its namespaced key (e.g. 'institution.name')."""
    service = get_settings_service(db)
    setting = service.update_setting(key, body.value)
    return APIResponse(
        success=True,
        message="Setting updated successfully",
        data=setting,
    )
