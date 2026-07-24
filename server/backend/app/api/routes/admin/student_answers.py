from uuid import UUID
from fastapi import APIRouter, Depends

from app.api.dependencies.auth import get_current_user, require_admin
from app.api.dependencies.services import EvaluationServiceDep
from app.schemas.evaluation import DescriptiveEvaluationRequest, StudentAnswerEvaluationResponse
from app.schemas.response import APIResponse
from app.models.user import User

router = APIRouter()


@router.patch("/{answer_id}/evaluate", response_model=APIResponse[StudentAnswerEvaluationResponse])
def evaluate_descriptive_answer(
    answer_id: UUID,
    data: DescriptiveEvaluationRequest,
    evaluation_service: EvaluationServiceDep,
    current_user: User = Depends(get_current_user),
    _=Depends(require_admin),
):
    """
    Manually evaluate a student's descriptive answer by assigning awarded marks and optional feedback.
    Recalculates session result score and updates evaluation status.
    """
    evaluated_answer = evaluation_service.evaluate_answer(
        answer_id=answer_id,
        evaluator_id=current_user.id,
        awarded_marks=data.awarded_marks,
        feedback=data.evaluator_feedback,
    )
    return APIResponse(
        success=True,
        message="Student answer evaluated successfully",
        data=evaluated_answer,
    )
