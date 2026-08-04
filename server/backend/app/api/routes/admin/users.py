from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies.auth import require_admin_only
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import UserServiceDep
from app.models.user import UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[UserResponse]])
def get_users(
    pagination: PaginationDep,
    user_service: UserServiceDep,
    search: str | None = Query(None, description="Search by name, username, or email"),
    role: UserRole | None = Query(None, description="Filter by user role"),
    _=Depends(require_admin_only),
):
    """Retrieve all users with pagination, search, and role filtering."""
    paginated_data = user_service.get_users(
        pagination.page, pagination.page_size, search=search, role=role
    )
    return APIResponse(
        success=True,
        message="Users retrieved successfully",
        data=paginated_data,
    )


@router.get("/{user_id}", response_model=APIResponse[UserResponse])
def get_user(
    user_id: UUID,
    user_service: UserServiceDep,
    _=Depends(require_admin_only),
):
    """Retrieve a specific user by ID."""
    user = user_service.get_user(user_id)
    return APIResponse(
        success=True,
        message="User retrieved successfully",
        data=user,
    )


@router.post("/", response_model=APIResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    user_service: UserServiceDep,
    _=Depends(require_admin_only),
):
    """Create a new user (admin/teacher)."""
    user = user_service.create_user(data)
    return APIResponse(
        success=True,
        message="User created successfully",
        data=user,
    )


@router.put("/{user_id}", response_model=APIResponse[UserResponse])
def update_user(
    user_id: UUID,
    data: UserUpdate,
    user_service: UserServiceDep,
    _=Depends(require_admin_only),
):
    """Update an existing user."""
    user = user_service.update_user(user_id, data)
    return APIResponse(
        success=True,
        message="User updated successfully",
        data=user,
    )


@router.delete("/{user_id}", response_model=APIResponse[None])
def delete_user(
    user_id: UUID,
    user_service: UserServiceDep,
    _=Depends(require_admin_only),
):
    """Delete a user by ID."""
    user_service.delete_user(user_id)
    return APIResponse(
        success=True,
        message="User deleted successfully",
    )
