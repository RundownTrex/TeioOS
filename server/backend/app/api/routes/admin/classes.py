from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import ClassServiceDep
from app.schemas.class_ import ClassCreate, ClassUpdate, ClassResponse
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[ClassResponse]])
def get_classes(
    pagination: PaginationDep,
    class_service: ClassServiceDep,
    _=Depends(require_admin),
    q: str | None = Query(None, max_length=255, description="Search classes by name"),
    department_id: UUID | None = Query(None, description="Filter classes by department ID"),
):
    """Retrieve all classes with pagination, optional name search and department filter."""
    paginated_data = class_service.get_classes(pagination.page, pagination.page_size, q, department_id)
    return APIResponse(
        success=True,
        message="Classes retrieved successfully",
        data=paginated_data,
    )


@router.get("/{class_id}", response_model=APIResponse[ClassResponse])
def get_class(
    class_id: UUID,
    class_service: ClassServiceDep,
    _=Depends(require_admin),
):
    """Retrieve a specific class by ID."""
    class_obj = class_service.get_class(class_id)
    return APIResponse(
        success=True,
        message="Class retrieved successfully",
        data=class_obj,
    )


@router.post("/", response_model=APIResponse[ClassResponse], status_code=status.HTTP_201_CREATED)
def create_class(
    data: ClassCreate,
    class_service: ClassServiceDep,
    _=Depends(require_admin),
):
    """Create a new class."""
    class_obj = class_service.create_class(data)
    return APIResponse(
        success=True,
        message="Class created successfully",
        data=class_obj,
    )


@router.put("/{class_id}", response_model=APIResponse[ClassResponse])
def update_class(
    class_id: UUID,
    data: ClassUpdate,
    class_service: ClassServiceDep,
    _=Depends(require_admin),
):
    """Update an existing class."""
    class_obj = class_service.update_class(class_id, data)
    return APIResponse(
        success=True,
        message="Class updated successfully",
        data=class_obj,
    )


@router.delete("/{class_id}", response_model=APIResponse[None])
def delete_class(
    class_id: UUID,
    class_service: ClassServiceDep,
    _=Depends(require_admin),
):
    """Delete a class by ID."""
    class_service.delete_class(class_id)
    return APIResponse(
        success=True,
        message="Class deleted successfully",
    )
