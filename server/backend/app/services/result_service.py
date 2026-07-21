from uuid import UUID

from app.models.result import Result
from app.repositories.result_repository import ResultRepository
from app.schemas.pagination import PaginatedData
from app.core.exceptions import NotFoundException


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
