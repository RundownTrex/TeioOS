from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import require_admin
from app.api.dependencies.pagination import PaginationDep
from app.api.dependencies.services import ExamServiceDep, QuestionServiceDep
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse
from app.schemas.question import QuestionReorder
from app.schemas.pagination import PaginatedData
from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/", response_model=APIResponse[PaginatedData[ExamResponse]])
def get_exams(
    pagination: PaginationDep,
    exam_service: ExamServiceDep,
    subject_id: UUID | None = None,
    _=Depends(require_admin),
):
    """Retrieve all exams with pagination, optionally filtered by subject."""
    paginated_data = exam_service.get_exams(pagination.page, pagination.page_size, subject_id)
    return APIResponse(
        success=True,
        message="Exams retrieved successfully",
        data=paginated_data,
    )


@router.get("/{exam_id}", response_model=APIResponse[ExamResponse])
def get_exam(
    exam_id: UUID,
    exam_service: ExamServiceDep,
    _=Depends(require_admin),
):
    """Retrieve a specific exam by ID."""
    exam = exam_service.get_exam(exam_id)
    return APIResponse(
        success=True,
        message="Exam retrieved successfully",
        data=exam,
    )


@router.post("/", response_model=APIResponse[ExamResponse], status_code=status.HTTP_201_CREATED)
def create_exam(
    data: ExamCreate,
    exam_service: ExamServiceDep,
    token=Depends(require_admin),
):
    """Create a new exam. The creator is stamped from the authenticated admin."""
    exam = exam_service.create_exam(data, creator_id=UUID(token.sub))
    return APIResponse(
        success=True,
        message="Exam created successfully",
        data=exam,
    )


@router.put("/{exam_id}", response_model=APIResponse[ExamResponse])
def update_exam(
    exam_id: UUID,
    data: ExamUpdate,
    exam_service: ExamServiceDep,
    _=Depends(require_admin),
):
    """Update an existing exam."""
    exam = exam_service.update_exam(exam_id, data)
    return APIResponse(
        success=True,
        message="Exam updated successfully",
        data=exam,
    )


@router.delete("/{exam_id}", response_model=APIResponse[None])
def delete_exam(
    exam_id: UUID,
    exam_service: ExamServiceDep,
    _=Depends(require_admin),
):
    """Delete an exam by ID. Refused while the exam has schedules."""
    exam_service.delete_exam(exam_id)
    return APIResponse(
        success=True,
        message="Exam deleted successfully",
    )


@router.put("/{exam_id}/questions/reorder", response_model=APIResponse[dict])
def reorder_questions(
    exam_id: UUID,
    data: QuestionReorder,
    question_service: QuestionServiceDep,
    _=Depends(require_admin),
):
    """Reassign display_order for an exam's questions following ordered_ids."""
    count = question_service.reorder_questions(exam_id, data.ordered_ids)
    return APIResponse(
        success=True,
        message="Questions reordered successfully",
        data={"count": count},
    )
