from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import ResultServiceDep, EvaluationServiceDep
from app.schemas.result import ResultResponse
from app.schemas.evaluation import StudentAnswerEvaluationResponse
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
    q: str | None = Query(None, description="Search results by student name or roll number"),
    evaluation_status: str | None = Query(None, description="Filter by evaluation status"),
    is_published: bool | None = Query(None, description="Filter by published status"),
    _=Depends(require_admin),
):
    """
    Retrieve read-only results.
    Can be filtered by student_id, exam_id, class_id, search, evaluation_status, and published status.
    """
    paginated_data = result_service.get_results(
        pagination.page, 
        pagination.page_size, 
        student_id=student_id, 
        exam_id=exam_id, 
        class_id=class_id,
        q=q,
        evaluation_status=evaluation_status,
        is_published=is_published,
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


@router.get("/{student_exam_id}/answers", response_model=APIResponse[List[StudentAnswerEvaluationResponse]])
def get_session_answers(
    student_exam_id: UUID,
    evaluation_service: EvaluationServiceDep,
    _=Depends(require_admin),
):
    """Retrieve all student answers (MCQ and Descriptive) for an exam assignment."""
    answers = evaluation_service.get_answers_for_session(student_exam_id)
    return APIResponse(
        success=True,
        message="Session student answers retrieved successfully",
        data=answers,
    )


@router.post("/{student_exam_id}/publish", response_model=APIResponse[ResultResponse])
def publish_result(
    student_exam_id: UUID,
    result_service: ResultServiceDep,
    _=Depends(require_admin),
):
    """Publish the final result for an exam assignment after all descriptive answers are evaluated."""
    result = result_service.publish_result(student_exam_id)
    return APIResponse(
        success=True,
        message="Result published successfully",
        data=result,
    )


@router.delete("/{result_id}", response_model=APIResponse[None])
def delete_result(
    result_id: UUID,
    result_service: ResultServiceDep,
    _=Depends(require_admin),
):
    """Delete a result record."""
    result_service.delete_result(result_id)
    return APIResponse(
        success=True,
        message="Result deleted successfully",
        data=None,
    )

