from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import SubjectServiceDep
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[SubjectResponse]])
def get_subjects(
    pagination: PaginationDep,
    subject_service: SubjectServiceDep,
    _=Depends(require_admin),
    q: str | None = Query(None, max_length=255, description="Search subjects by name or subject code"),
    department_id: UUID | None = Query(None, description="Filter subjects by department ID"),
):
    """Retrieve all subjects with pagination, optional name/code search and department filter."""
    paginated_data = subject_service.get_subjects(pagination.page, pagination.page_size, q, department_id)
    return APIResponse(
        success=True,
        message="Subjects retrieved successfully",
        data=paginated_data,
    )


@router.get("/{subject_id}", response_model=APIResponse[SubjectResponse])
def get_subject(
    subject_id: UUID,
    subject_service: SubjectServiceDep,
    _=Depends(require_admin),
):
    """Retrieve a specific subject by ID."""
    subject = subject_service.get_subject(subject_id)
    return APIResponse(
        success=True,
        message="Subject retrieved successfully",
        data=subject,
    )


@router.post("/", response_model=APIResponse[SubjectResponse], status_code=status.HTTP_201_CREATED)
def create_subject(
    data: SubjectCreate,
    subject_service: SubjectServiceDep,
    _=Depends(require_admin),
):
    """Create a new subject."""
    subject = subject_service.create_subject(data)
    return APIResponse(
        success=True,
        message="Subject created successfully",
        data=subject,
    )


@router.put("/{subject_id}", response_model=APIResponse[SubjectResponse])
def update_subject(
    subject_id: UUID,
    data: SubjectUpdate,
    subject_service: SubjectServiceDep,
    _=Depends(require_admin),
):
    """Update an existing subject."""
    subject = subject_service.update_subject(subject_id, data)
    return APIResponse(
        success=True,
        message="Subject updated successfully",
        data=subject,
    )


@router.delete("/{subject_id}", response_model=APIResponse[None])
def delete_subject(
    subject_id: UUID,
    subject_service: SubjectServiceDep,
    _=Depends(require_admin),
):
    """Delete a subject by ID."""
    subject_service.delete_subject(subject_id)
    return APIResponse(
        success=True,
        message="Subject deleted successfully",
    )
