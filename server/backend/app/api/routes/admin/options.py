from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import OptionServiceDep
from app.schemas.option import OptionCreate, OptionUpdate, OptionResponse
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[OptionResponse]])
def get_options(
    pagination: PaginationDep,
    option_service: OptionServiceDep,
    question_id: UUID | None = None,
    _=Depends(require_admin),
):
    """Retrieve options, optionally filtered by question_id, with pagination."""
    paginated_data = option_service.get_options(pagination.page, pagination.page_size, question_id)
    return APIResponse(
        success=True,
        message="Options retrieved successfully",
        data=paginated_data,
    )


@router.get("/{option_id}", response_model=APIResponse[OptionResponse])
def get_option(
    option_id: UUID,
    option_service: OptionServiceDep,
    _=Depends(require_admin),
):
    """Retrieve a specific option by ID."""
    option = option_service.get_option(option_id)
    return APIResponse(
        success=True,
        message="Option retrieved successfully",
        data=option,
    )


@router.post("/", response_model=APIResponse[OptionResponse], status_code=status.HTTP_201_CREATED)
def create_option(
    data: OptionCreate,
    option_service: OptionServiceDep,
    _=Depends(require_admin),
):
    """Create a new option. Automatically unsets any existing correct option if this is marked correct."""
    option = option_service.create_option(data)
    return APIResponse(
        success=True,
        message="Option created successfully",
        data=option,
    )


@router.put("/{option_id}", response_model=APIResponse[OptionResponse])
def update_option(
    option_id: UUID,
    data: OptionUpdate,
    option_service: OptionServiceDep,
    _=Depends(require_admin),
):
    """Update an existing option. Automatically unsets other correct options if this is marked correct."""
    option = option_service.update_option(option_id, data)
    return APIResponse(
        success=True,
        message="Option updated successfully",
        data=option,
    )


@router.delete("/{option_id}", response_model=APIResponse[None])
def delete_option(
    option_id: UUID,
    option_service: OptionServiceDep,
    _=Depends(require_admin),
):
    """Delete an option by ID. Prevents deletion if the question would fall below 2 options."""
    option_service.delete_option(option_id)
    return APIResponse(
        success=True,
        message="Option deleted successfully",
    )
