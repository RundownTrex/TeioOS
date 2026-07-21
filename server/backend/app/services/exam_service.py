from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.exam import Exam
from app.repositories.exam_repository import ExamRepository
from app.repositories.user_repository import UserRepository
from app.schemas.exam import ExamCreate, ExamUpdate
from app.schemas.pagination import PaginatedData
from app.core.exceptions import NotFoundException

class ExamService:
    def __init__(self, db: Session, exam_repo: ExamRepository, user_repo: UserRepository):
        self.db = db
        self.exam_repo = exam_repo
        self.user_repo = user_repo

    def get_exams(self, page: int, page_size: int) -> PaginatedData[Exam]:
        skip = (page - 1) * page_size
        items = self.exam_repo.get_all(skip, page_size)
        total = self.exam_repo.get_count()
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def get_exam(self, exam_id: UUID) -> Exam:
        exam = self.exam_repo.get_by_id(exam_id)
        if not exam:
            raise NotFoundException(resource_name="Exam")
        return exam

    def _validate_creator(self, user_id: UUID) -> None:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(resource_name="User")

    def create_exam(self, data: ExamCreate) -> Exam:
        self._validate_creator(data.created_by)
        
        exam = Exam(
            title=data.title,
            description=data.description,
            duration_minutes=data.duration_minutes,
            total_marks=data.total_marks,
            created_by=data.created_by
        )
        try:
            self.exam_repo.create(exam)
            self.db.commit()
            self.db.refresh(exam)
            return exam
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_exam(self, exam_id: UUID, data: ExamUpdate) -> Exam:
        exam = self.get_exam(exam_id)
        
        if data.created_by and data.created_by != exam.created_by:
            self._validate_creator(data.created_by)
            
        if data.title:
            exam.title = data.title
        if data.description is not None:
            exam.description = data.description
        if data.duration_minutes:
            exam.duration_minutes = data.duration_minutes
        if data.total_marks:
            exam.total_marks = data.total_marks
        if data.created_by:
            exam.created_by = data.created_by

        try:
            self.db.commit()
            self.db.refresh(exam)
            return exam
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def delete_exam(self, exam_id: UUID) -> None:
        exam = self.get_exam(exam_id)
        try:
            self.exam_repo.delete(exam)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise
