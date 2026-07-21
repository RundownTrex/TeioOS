from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import ExamScheduleServiceDep
from app.schemas.exam_schedule import ExamScheduleCreate, ExamScheduleUpdate, ExamScheduleResponse
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[ExamScheduleResponse]])
def get_schedules(
    pagination: PaginationDep,
    schedule_service: ExamScheduleServiceDep,
    exam_id: UUID | None = None,
    _=Depends(require_admin),
):
    """Retrieve all schedules, optionally filtered by exam_id, with pagination."""
    paginated_data = schedule_service.get_schedules(pagination.page, pagination.page_size, exam_id)
    return APIResponse(
        success=True,
        message="Schedules retrieved successfully",
        data=paginated_data,
    )


@router.get("/{schedule_id}", response_model=APIResponse[ExamScheduleResponse])
def get_schedule(
    schedule_id: UUID,
    schedule_service: ExamScheduleServiceDep,
    _=Depends(require_admin),
):
    """Retrieve a specific schedule by ID."""
    schedule = schedule_service.get_schedule(schedule_id)
    return APIResponse(
        success=True,
        message="Schedule retrieved successfully",
        data=schedule,
    )


@router.post("/", response_model=APIResponse[ExamScheduleResponse], status_code=status.HTTP_201_CREATED)
def create_schedule(
    data: ExamScheduleCreate,
    schedule_service: ExamScheduleServiceDep,
    _=Depends(require_admin),
):
    """Create a new exam schedule."""
    schedule = schedule_service.create_schedule(data)
    return APIResponse(
        success=True,
        message="Schedule created successfully",
        data=schedule,
    )


@router.put("/{schedule_id}", response_model=APIResponse[ExamScheduleResponse])
def update_schedule(
    schedule_id: UUID,
    data: ExamScheduleUpdate,
    schedule_service: ExamScheduleServiceDep,
    _=Depends(require_admin),
):
    """Update an existing schedule (supports activation/deactivation via status)."""
    schedule = schedule_service.update_schedule(schedule_id, data)
    return APIResponse(
        success=True,
        message="Schedule updated successfully",
        data=schedule,
    )


@router.delete("/{schedule_id}", response_model=APIResponse[None])
def delete_schedule(
    schedule_id: UUID,
    schedule_service: ExamScheduleServiceDep,
    _=Depends(require_admin),
):
    """Delete a schedule by ID."""
    schedule_service.delete_schedule(schedule_id)
    return APIResponse(
        success=True,
        message="Schedule deleted successfully",
    )
