from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import QuestionServiceDep
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[QuestionResponse]])
def get_questions(
    pagination: PaginationDep,
    question_service: QuestionServiceDep,
    exam_id: UUID | None = None,
    _=Depends(require_admin),
):
    """Retrieve all questions, optionally filtered by exam_id, with pagination."""
    paginated_data = question_service.get_questions(pagination.page, pagination.page_size, exam_id)
    return APIResponse(
        success=True,
        message="Questions retrieved successfully",
        data=paginated_data,
    )


@router.get("/{question_id}", response_model=APIResponse[QuestionResponse])
def get_question(
    question_id: UUID,
    question_service: QuestionServiceDep,
    _=Depends(require_admin),
):
    """Retrieve a specific question by ID, including its MCQ options."""
    question = question_service.get_question(question_id)
    return APIResponse(
        success=True,
        message="Question retrieved successfully",
        data=question,
    )


@router.post("/", response_model=APIResponse[QuestionResponse], status_code=status.HTTP_201_CREATED)
def create_question(
    data: QuestionCreate,
    question_service: QuestionServiceDep,
    _=Depends(require_admin),
):
    """Create a new question with MCQ options."""
    question = question_service.create_question(data)
    return APIResponse(
        success=True,
        message="Question created successfully",
        data=question,
    )


@router.put("/{question_id}", response_model=APIResponse[QuestionResponse])
def update_question(
    question_id: UUID,
    data: QuestionUpdate,
    question_service: QuestionServiceDep,
    _=Depends(require_admin),
):
    """Update an existing question. Replaces options entirely if provided."""
    question = question_service.update_question(question_id, data)
    return APIResponse(
        success=True,
        message="Question updated successfully",
        data=question,
    )


@router.delete("/{question_id}", response_model=APIResponse[None])
def delete_question(
    question_id: UUID,
    question_service: QuestionServiceDep,
    _=Depends(require_admin),
):
    """Delete a question by ID."""
    question_service.delete_question(question_id)
    return APIResponse(
        success=True,
        message="Question deleted successfully",
    )
