from datetime import datetime, timezone
from uuid import UUID

from app.models.result import Result, EvaluationStatus
from app.repositories.result_repository import ResultRepository
from app.schemas.pagination import PaginatedData
from app.core.exceptions import NotFoundException, BusinessRuleException


class ResultService:
    def __init__(
        self, 
        result_repo: ResultRepository
    ):
        self.result_repo = result_repo

    def get_results(
        self, 
        page: int, 
        page_size: int, 
        student_id: UUID | None = None, 
        exam_id: UUID | None = None, 
        class_id: UUID | None = None
    ) -> PaginatedData[Result]:
        """
        Fetch results filtered by optional query parameters.
        Results are eager loaded with session, student, schedule, and exam data.
        """
        skip = (page - 1) * page_size
        items = self.result_repo.get_all(skip, page_size, student_id, exam_id, class_id)
        total = self.result_repo.get_count(student_id, exam_id, class_id)
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def get_result(self, result_id: UUID) -> Result:
        """
        Fetch a single result by its ID.
        """
        result = self.result_repo.get_by_id(result_id)
        if not result:
            raise NotFoundException(resource_name="Result")
        return result

    def get_result_by_student_exam(self, student_exam_id: UUID) -> Result:
        """
        Fetch a result by its student exam (assignment) ID.
        """
        result = self.result_repo.get_by_student_exam_id(student_exam_id)
        if not result:
            raise NotFoundException(resource_name="Result")
        return result

    def publish_result(self, student_exam_id: UUID) -> Result:
        """
        Publishes the result for an exam assignment after verifying evaluation_status == COMPLETED.
        """
        result = self.result_repo.get_by_student_exam_id(student_exam_id)
        if not result:
            raise NotFoundException(resource_name="Result")

        if result.evaluation_status != EvaluationStatus.COMPLETED:
            raise BusinessRuleException("Cannot publish result: descriptive answers are still pending evaluation")

        result.published_at = datetime.now(timezone.utc)
        self.result_repo.update(result)
        self.result_repo.session.commit()
        self.result_repo.session.refresh(result)
        return result

