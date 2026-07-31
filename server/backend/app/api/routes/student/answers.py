from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends

from app.api.dependencies.auth import get_active_exam_student
from app.api.dependencies.services import ExamDeliveryServiceDep
from app.schemas.response import APIResponse
from app.schemas.token import TokenPayload
from app.schemas.student_exam_delivery import AnswerSubmission

router = APIRouter()


@router.post("/", response_model=APIResponse[None])
def save_answer(
    submission: AnswerSubmission,
    token_payload: Annotated[TokenPayload, Depends(get_active_exam_student)],
    delivery_service: ExamDeliveryServiceDep,
):
    """
    Idempotent save for a single answer. Used for auto-save and manual saving.
    Requires Elevated Exam Token.
    """
    delivery_service.save_answer(
        assignment_id=UUID(token_payload.exam_session_id),
        schedule_id=UUID(token_payload.exam_schedule_id),
        question_id=submission.question_id,
        selected_option_id=submission.selected_option_id,
        answer_text=submission.answer_text,
    )
    return APIResponse(success=True, message="Answer saved successfully")
