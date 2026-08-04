from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import StudentExamServiceDep
from app.schemas.student_exam import (
    StudentAssignmentCreate,
    StudentAssignmentResponse,
    StudentAssignmentUpdate,
    ClassAssignmentCreate,
    ClassAssignmentResponse,
    DepartmentAssignmentCreate,
    DepartmentAssignmentResponse,
)
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

# This router is mounted under /admin/exam-schedules/{schedule_id}/students
router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[StudentAssignmentResponse]])
def get_assigned_students(
    schedule_id: UUID,
    pagination: PaginationDep,
    assignment_service: StudentExamServiceDep,
    q: str | None = Query(None, description="Search assigned students by name or roll number"),
    class_id: UUID | None = Query(None, description="Filter assigned students by class ID"),
    status: str | None = Query(None, description="Filter assigned students by status"),
    _=Depends(require_admin),
):
    """Retrieve all students assigned to a specific exam schedule with search and filters."""
    paginated_data = assignment_service.get_assigned_students(
        schedule_id, pagination.page, pagination.page_size, q=q, class_id=class_id, status=status
    )
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
    """Assign an individual student to an exam schedule."""
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
    """Update an existing assignment (e.g. per-student exam time override)."""
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
    """Assign all active students of an entire class to an exam schedule."""
    result = assignment_service.assign_class(schedule_id, data.class_id)
    return APIResponse(
        success=True,
        message="Class assigned successfully",
        data=result,
    )


@router.post("/departments", response_model=APIResponse[DepartmentAssignmentResponse], status_code=status.HTTP_201_CREATED)
def assign_department(
    schedule_id: UUID,
    data: DepartmentAssignmentCreate,
    assignment_service: StudentExamServiceDep,
    _=Depends(require_admin),
):
    """Assign all active students of an entire department to an exam schedule."""
    result = assignment_service.assign_department(schedule_id, data.department_id)
    return APIResponse(
        success=True,
        message="Department assigned successfully",
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
