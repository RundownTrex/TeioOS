from uuid import UUID
from fastapi import APIRouter, Depends

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import ResultServiceDep
from app.schemas.result import ResultResponse
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[ResultResponse]])
def get_results(
    pagination: PaginationDep,
    result_service: ResultServiceDep,
    student_id: UUID | None = None,
    exam_id: UUID | None = None,
    class_id: UUID | None = None,
    _=Depends(require_admin),
):
    """
    Retrieve read-only results.
    Can be filtered by student_id, exam_id, or class_id.
    """
    paginated_data = result_service.get_results(
        pagination.page, 
        pagination.page_size, 
        student_id=student_id, 
        exam_id=exam_id, 
        class_id=class_id
    )
    return APIResponse(
        success=True,
        message="Results retrieved successfully",
        data=paginated_data,
    )


@router.get("/{result_id}", response_model=APIResponse[ResultResponse])
def get_result(
    result_id: UUID,
    result_service: ResultServiceDep,
    _=Depends(require_admin),
):
    """Retrieve a single result by its ID."""
    result = result_service.get_result(result_id)
    return APIResponse(
        success=True,
        message="Result retrieved successfully",
        data=result,
    )
