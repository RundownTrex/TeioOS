from fastapi import APIRouter, Depends, Query

from app.api.dependencies.auth import require_admin
from app.api.dependencies.services import AnalyticsServiceDep
from app.schemas.response import APIResponse
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    StudentOverviewResponse,
    CurrentSessionResponse,
    ExamPerformanceResponse,
    PendingEvaluationResponse,
    SubmissionStatusCount,
)

router = APIRouter()


@router.get("/overview", response_model=APIResponse[AnalyticsOverviewResponse])
def get_overview(
    analytics_service: AnalyticsServiceDep,
    _=Depends(require_admin),
):
    """Aggregated analytics for the dashboard overview view."""
    data = analytics_service.get_overview()
    return APIResponse(success=True, message="Analytics overview retrieved successfully", data=data)


@router.get("/students/overview", response_model=APIResponse[StudentOverviewResponse])
def get_student_overview(
    analytics_service: AnalyticsServiceDep,
    _=Depends(require_admin),
):
    """Session-level aggregates across all exam schedules."""
    data = analytics_service.get_student_overview()
    return APIResponse(success=True, message="Student monitoring overview retrieved successfully", data=data)


@router.get("/students/sessions", response_model=APIResponse[list[CurrentSessionResponse]])
def get_current_sessions(
    analytics_service: AnalyticsServiceDep,
    _=Depends(require_admin),
):
    """Active examination sessions (assignment status = in_progress)."""
    data = analytics_service.get_current_sessions()
    return APIResponse(success=True, message="Active examination sessions retrieved successfully", data=data)


@router.get("/students/submission-status", response_model=APIResponse[list[SubmissionStatusCount]])
def get_submission_status(
    analytics_service: AnalyticsServiceDep,
    _=Depends(require_admin),
):
    """Submission status distribution across all assignments."""
    data = analytics_service.get_submission_status()
    return APIResponse(success=True, message="Submission status distribution retrieved successfully", data=data)


@router.get("/exams/performance", response_model=APIResponse[list[ExamPerformanceResponse]])
def get_exam_performance(
    analytics_service: AnalyticsServiceDep,
    _=Depends(require_admin),
):
    """Average performance and submission count per exam."""
    data = analytics_service.get_exam_performance()
    return APIResponse(success=True, message="Exam performance retrieved successfully", data=data)


@router.get("/pending-evaluations", response_model=APIResponse[list[PendingEvaluationResponse]])
def get_pending_evaluations(
    analytics_service: AnalyticsServiceDep,
    limit: int = Query(default=10, ge=1, le=50),
    _=Depends(require_admin),
):
    """Exam sessions with descriptive answers still awaiting manual evaluation."""
    data = analytics_service.get_pending_evaluations(limit=limit)
    return APIResponse(success=True, message="Pending evaluations retrieved successfully", data=data)
