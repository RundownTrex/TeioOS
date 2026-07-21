from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import StudentServiceDep
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[StudentResponse]])
def get_students(
    pagination: PaginationDep,
    student_service: StudentServiceDep,
    _=Depends(require_admin),
):
    """Retrieve all students with pagination."""
    paginated_data = student_service.get_students(pagination.page, pagination.page_size)
    return APIResponse(
        success=True,
        message="Students retrieved successfully",
        data=paginated_data,
    )


@router.get("/{student_id}", response_model=APIResponse[StudentResponse])
def get_student(
    student_id: UUID,
    student_service: StudentServiceDep,
    _=Depends(require_admin),
):
    """Retrieve a specific student by ID."""
    student = student_service.get_student(student_id)
    return APIResponse(
        success=True,
        message="Student retrieved successfully",
        data=student,
    )


@router.post("/", response_model=APIResponse[StudentResponse], status_code=status.HTTP_201_CREATED)
def create_student(
    data: StudentCreate,
    student_service: StudentServiceDep,
    _=Depends(require_admin),
):
    """Create a new student."""
    student = student_service.create_student(data)
    return APIResponse(
        success=True,
        message="Student created successfully",
        data=student,
    )


@router.put("/{student_id}", response_model=APIResponse[StudentResponse])
def update_student(
    student_id: UUID,
    data: StudentUpdate,
    student_service: StudentServiceDep,
    _=Depends(require_admin),
):
    """Update an existing student."""
    student = student_service.update_student(student_id, data)
    return APIResponse(
        success=True,
        message="Student updated successfully",
        data=student,
    )


@router.delete("/{student_id}", response_model=APIResponse[None])
def delete_student(
    student_id: UUID,
    student_service: StudentServiceDep,
    _=Depends(require_admin),
):
    """Delete a student by ID."""
    student_service.delete_student(student_id)
    return APIResponse(
        success=True,
        message="Student deleted successfully",
    )
