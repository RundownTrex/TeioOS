from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Request, Header

from app.api.dependencies.auth import require_student, get_active_exam_student
from app.api.dependencies.services import ExamSessionServiceDep, ExamDeliveryServiceDep
from app.schemas.response import APIResponse
from app.schemas.token import TokenPayload
from app.core.exceptions import AuthorizationException
from app.schemas.student_exam_delivery import (
    StudentAvailableExamResponse,
    ExamInstructionResponse,
    ExamStartResponse,
    ExamQuestionsPayload,
    ExamSubmitRequest,
    ExamSubmitConfirmation,
    ExamSessionSnapshotResponse,
)

router = APIRouter()


@router.get("/", response_model=APIResponse[list[StudentAvailableExamResponse]])
def list_assigned_exams(
    token_payload: Annotated[TokenPayload, Depends(require_student)],
    session_service: ExamSessionServiceDep,
):
    """
    List all exams assigned to the student together with the candidate's personal
    exam session. Timing is exposed via the session (started_at, expires_at,
    duration), not derived from the schedule window.
    Requires Base Student JWT.
    """
    data = session_service.get_assigned_exams(UUID(token_payload.sub))
    return APIResponse(
        success=True,
        message="Assigned exams retrieved successfully",
        data=data
    )


@router.get("/{schedule_id}/instructions", response_model=APIResponse[ExamInstructionResponse])
def get_exam_instructions(
    schedule_id: UUID,
    token_payload: Annotated[TokenPayload, Depends(require_student)],
    session_service: ExamSessionServiceDep,
):
    """
    Get instructions and details for an exam before starting.
    Requires Base Student JWT.
    """
    data = session_service.get_exam_instructions(UUID(token_payload.sub), schedule_id)
    return APIResponse(
        success=True,
        message="Exam instructions retrieved",
        data=data
    )


@router.get("/{schedule_id}/session", response_model=APIResponse[ExamSessionSnapshotResponse])
def get_exam_session(
    schedule_id: UUID,
    token_payload: Annotated[TokenPayload, Depends(require_student)],
    session_service: ExamSessionServiceDep,
):
    """
    Returns the candidate's personal examination session (assignmentId, startedAt,
    expiresAt, submittedAt, status, duration, lastActivityAt) and the authoritative
    server time. The frontend renders all timing from this object and recomputes its
    clock offset from server_current_time. Returns 404 if no session has been started yet.
    Requires Base Student JWT.
    """
    data = session_service.get_exam_session(UUID(token_payload.sub), schedule_id)
    return APIResponse(
        success=True,
        message="Exam session retrieved",
        data=data
    )


@router.post("/{schedule_id}/start", response_model=APIResponse[ExamStartResponse])
def start_exam(
    schedule_id: UUID,
    request: Request,
    token_payload: Annotated[TokenPayload, Depends(require_student)],
    session_service: ExamSessionServiceDep,
    x_machine_id: Annotated[str | None, Header()] = None,
):
    """
    Starts or resumes an exam session. 
    Issues an Elevated Exam Token required for all subsequent exam endpoints.
    Resuming a paused session shifts the individual deadline forward by the
    pause duration so paused time is never counted as examination time.
    """
    data = session_service.start_exam_session(
        student_id=UUID(token_payload.sub), 
        schedule_id=schedule_id,
        machine_id=x_machine_id,
        ip_address=request.client.host if request.client else None
    )
    return APIResponse(
        success=True,
        message="Exam started successfully",
        data=data
    )


@router.post("/{schedule_id}/pause", response_model=APIResponse[ExamSessionSnapshotResponse])
def pause_exam(
    schedule_id: UUID,
    token_payload: Annotated[TokenPayload, Depends(require_student)],
    session_service: ExamSessionServiceDep,
):
    """
    Pauses the candidate's individual exam timer (candidate left the exam).
    While paused, examination time is not counted; it resumes (and the deadline
    is shifted) when the candidate calls POST /start again. Idempotent.
    Sent by the exam workbench on page close/hide and used as a fallback by the
    server-side inactivity sweeper. Requires Base Student JWT.
    """
    data = session_service.pause_exam_session(UUID(token_payload.sub), schedule_id)
    return APIResponse(
        success=True,
        message="Exam session paused",
        data=data
    )


@router.get("/{schedule_id}/questions", response_model=APIResponse[ExamQuestionsPayload])
def get_exam_questions(
    schedule_id: UUID,
    token_payload: Annotated[TokenPayload, Depends(get_active_exam_student)],
    delivery_service: ExamDeliveryServiceDep,
):
    """
    Get all questions for the exam (sanitized).
    Requires Elevated Exam Token.
    """
    # Ensure they are fetching questions for the schedule they are active in
    if token_payload.exam_schedule_id != str(schedule_id):
        raise AuthorizationException("Token is not valid for this exam schedule")
        
    data = delivery_service.get_questions_for_session(
        UUID(token_payload.exam_session_id), 
        schedule_id
    )
    return APIResponse(
        success=True,
        message="Questions retrieved successfully",
        data=data
    )


@router.post("/{schedule_id}/submit", response_model=APIResponse[ExamSubmitConfirmation])
def submit_exam(
    schedule_id: UUID,
    token_payload: Annotated[TokenPayload, Depends(get_active_exam_student)],
    session_service: ExamSessionServiceDep,
    payload: ExamSubmitRequest = ExamSubmitRequest(),
):
    """
    Submit the exam (manual or auto-submit), preventing further answers and calculating results synchronously.
    Requires Elevated Exam Token.
    """
    if token_payload.exam_schedule_id != str(schedule_id):
        raise AuthorizationException("Token is not valid for this exam schedule")

    confirmation = session_service.submit_exam(
        student_id=UUID(token_payload.sub), 
        schedule_id=schedule_id,
        is_auto_submit=payload.is_auto_submitted
    )
    return APIResponse(
        success=True, 
        message=confirmation.message,
        data=confirmation
    )
