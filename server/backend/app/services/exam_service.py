from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.exam import Exam
from app.repositories.exam_repository import ExamRepository
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.repositories.user_repository import UserRepository
from app.repositories.subject_repository import SubjectRepository
from app.schemas.exam import ExamCreate, ExamUpdate
from app.schemas.pagination import PaginatedData
from app.core.exceptions import NotFoundException, BusinessRuleException

class ExamService:
    def __init__(
        self,
        db: Session,
        exam_repo: ExamRepository,
        user_repo: UserRepository,
        subject_repo: SubjectRepository,
        schedule_repo: ExamScheduleRepository,
    ):
        self.db = db
        self.exam_repo = exam_repo
        self.user_repo = user_repo
        self.subject_repo = subject_repo
        self.schedule_repo = schedule_repo

    def get_exams(
        self,
        page: int,
        page_size: int,
        subject_id: UUID | None = None,
        search: str | None = None,
        status: str | None = None,
    ) -> PaginatedData[Exam]:
        skip = (page - 1) * page_size
        search_query = search.strip() if search else None
        items = self.exam_repo.get_all(skip, page_size, subject_id=subject_id, search=search_query, status=status)
        total = self.exam_repo.get_count(subject_id=subject_id, search=search_query, status=status)
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

    def _validate_subject(self, subject_id: UUID) -> None:
        subject = self.subject_repo.get_by_id(subject_id)
        if not subject:
            raise NotFoundException(resource_name="Subject")

    @staticmethod
    def _normalize_title(title: str | None) -> str | None:
        return title.strip() if title and title.strip() else None

    def create_exam(self, data: ExamCreate, creator_id: UUID | None = None) -> Exam:
        created_by = data.created_by or creator_id
        if not created_by:
            raise BusinessRuleException("created_by is required")
        self._validate_creator(created_by)
        self._validate_subject(data.subject_id)

        exam = Exam(
            title=self._normalize_title(data.title),
            duration_minutes=data.duration_minutes,
            total_marks=data.total_marks,
            instructions=data.instructions.strip() if data.instructions and data.instructions.strip() else None,
            status=data.status or "draft",
            created_by=created_by,
            subject_id=data.subject_id,
        )
        try:
            self.exam_repo.create(exam)
            self.db.commit()
            self.db.refresh(exam)
            exam.question_count = 0
            return exam
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_exam(self, exam_id: UUID, data: ExamUpdate) -> Exam:
        exam = self.get_exam(exam_id)

        if data.created_by and data.created_by != exam.created_by:
            self._validate_creator(data.created_by)

        if data.subject_id and data.subject_id != exam.subject_id:
            self._validate_subject(data.subject_id)

        if data.title is not None:
            exam.title = self._normalize_title(data.title)
        if data.duration_minutes is not None:
            exam.duration_minutes = data.duration_minutes
        if data.total_marks is not None:
            exam.total_marks = data.total_marks
        if data.instructions is not None:
            exam.instructions = data.instructions.strip() if data.instructions and data.instructions.strip() else None
        if data.status is not None:
            exam.status = data.status
        if data.created_by:
            exam.created_by = data.created_by
        if data.subject_id:
            exam.subject_id = data.subject_id

        try:
            self.db.commit()
            self.db.refresh(exam)
            exam.question_count = self.exam_repo.get_question_count(exam.id)
            return exam
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def delete_exam(self, exam_id: UUID) -> None:
        exam = self.get_exam(exam_id)
        if self.schedule_repo.get_count(exam_id=exam_id) > 0:
            raise BusinessRuleException(
                "Cannot delete an exam that has schedules. Delete its schedules first."
            )
        try:
            self.exam_repo.delete(exam)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise
