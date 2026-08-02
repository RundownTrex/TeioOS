from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import DepartmentServiceDep
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[DepartmentResponse]])
def get_departments(
    pagination: PaginationDep,
    department_service: DepartmentServiceDep,
    _=Depends(require_admin),
    q: str | None = Query(None, max_length=255, description="Search departments by name"),
):
    """Retrieve all departments with pagination and optional name search."""
    paginated_data = department_service.get_departments(pagination.page, pagination.page_size, q)
    return APIResponse(
        success=True,
        message="Departments retrieved successfully",
        data=paginated_data,
    )


@router.get("/{department_id}", response_model=APIResponse[DepartmentResponse])
def get_department(
    department_id: UUID,
    department_service: DepartmentServiceDep,
    _=Depends(require_admin),
):
    """Retrieve a specific department by ID."""
    department = department_service.get_department(department_id)
    return APIResponse(
        success=True,
        message="Department retrieved successfully",
        data=department,
    )


@router.post("/", response_model=APIResponse[DepartmentResponse], status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    department_service: DepartmentServiceDep,
    _=Depends(require_admin),
):
    """Create a new department."""
    department = department_service.create_department(data)
    return APIResponse(
        success=True,
        message="Department created successfully",
        data=department,
    )


@router.put("/{department_id}", response_model=APIResponse[DepartmentResponse])
def update_department(
    department_id: UUID,
    data: DepartmentUpdate,
    department_service: DepartmentServiceDep,
    _=Depends(require_admin),
):
    """Update an existing department."""
    department = department_service.update_department(department_id, data)
    return APIResponse(
        success=True,
        message="Department updated successfully",
        data=department,
    )


@router.delete("/{department_id}", response_model=APIResponse[None])
def delete_department(
    department_id: UUID,
    department_service: DepartmentServiceDep,
    _=Depends(require_admin),
):
    """Delete a department by ID."""
    department_service.delete_department(department_id)
    return APIResponse(
        success=True,
        message="Department deleted successfully",
    )
