from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import StudentExamServiceDep
from app.schemas.student_exam import (
    StudentAssignmentCreate,
    StudentAssignmentResponse,
    StudentAssignmentUpdate,
    ClassAssignmentCreate,
    ClassAssignmentResponse,
)
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

# This router will be mounted under /admin/exam-schedules/{schedule_id}/students
router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[StudentAssignmentResponse]])
def get_assigned_students(
    schedule_id: UUID,
    pagination: PaginationDep,
    assignment_service: StudentExamServiceDep,
    _=Depends(require_admin),
):
    """Retrieve all students assigned to a specific exam schedule."""
    paginated_data = assignment_service.get_assigned_students(schedule_id, pagination.page, pagination.page_size)
    return APIResponse(
        success=True,
        message="Assigned students retrieved successfully",
        data=paginated_data,
    )


@router.post("/", response_model=APIResponse[StudentAssignmentResponse], status_code=status.HTTP_201_CREATED)
def assign_student(
    schedule_id: UUID,
    data: StudentAssignmentCreate,
    assignment_service: StudentExamServiceDep,
    _=Depends(require_admin),
):
    """Assign a student to an exam schedule."""
    assignment = assignment_service.assign_student(schedule_id, data)
    return APIResponse(
        success=True,
        message="Student assigned successfully",
        data=assignment,
    )


@router.put("/{student_id}", response_model=APIResponse[StudentAssignmentResponse])
def update_assignment(
    schedule_id: UUID,
    student_id: UUID,
    data: StudentAssignmentUpdate,
    assignment_service: StudentExamServiceDep,
    _=Depends(require_admin),
):
    """Update an existing assignment (per-student exam time override)."""
    assignment = assignment_service.update_assignment(schedule_id, student_id, data)
    return APIResponse(
        success=True,
        message="Assignment updated successfully",
        data=assignment,
    )


@router.post("/classes", response_model=APIResponse[ClassAssignmentResponse], status_code=status.HTTP_201_CREATED)
def assign_class(
    schedule_id: UUID,
    data: ClassAssignmentCreate,
    assignment_service: StudentExamServiceDep,
    _=Depends(require_admin),
):
    """Assign all active students of a class to an exam schedule."""
    result = assignment_service.assign_class(schedule_id, data.class_id)
    return APIResponse(
        success=True,
        message="Class assigned successfully",
        data=result,
    )


@router.delete("/{student_id}", response_model=APIResponse[None])
def remove_assignment(
    schedule_id: UUID,
    student_id: UUID,
    assignment_service: StudentExamServiceDep,
    _=Depends(require_admin),
):
    """Remove a student assignment from an exam schedule."""
    assignment_service.remove_assignment(schedule_id, student_id)
    return APIResponse(
        success=True,
        message="Assignment removed successfully",
    )
