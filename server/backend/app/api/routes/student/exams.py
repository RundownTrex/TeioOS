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
)

router = APIRouter()


@router.get("/", response_model=APIResponse[list[StudentAvailableExamResponse]])
def list_assigned_exams(
    token_payload: Annotated[TokenPayload, Depends(require_student)],
    session_service: ExamSessionServiceDep,
):
    """
    List all active or scheduled exams assigned to the student.
    Requires Base Student JWT.
    """
    schedules = session_service.get_assigned_schedules(UUID(token_payload.sub))
    data = []
    for sched in schedules:
        data.append(StudentAvailableExamResponse(
            schedule_id=sched.id,
            subject_name=sched.exam.subject.name,
            subject_code=sched.exam.subject.subject_code,
            department_name=sched.exam.subject.department.name,
            duration_minutes=sched.exam.duration_minutes,
            total_marks=sched.exam.total_marks,
            status=sched.status,
            start_time=sched.start_time,
            end_time=sched.end_time
        ))

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
    schedule = session_service.get_schedule_instructions(UUID(token_payload.sub), schedule_id)
    data = ExamInstructionResponse(
        schedule_id=schedule.id,
        subject_name=schedule.exam.subject.name,
        subject_code=schedule.exam.subject.subject_code,
        department_name=schedule.exam.subject.department.name,
        duration_minutes=schedule.exam.duration_minutes,
        total_marks=schedule.exam.total_marks,
        start_time=schedule.start_time,
        end_time=schedule.end_time,
        status=schedule.status
    )
    return APIResponse(
        success=True,
        message="Exam instructions retrieved",
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
