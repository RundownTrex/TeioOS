from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.models.subject import Subject
from app.repositories.subject_repository import SubjectRepository
from app.repositories.department_repository import DepartmentRepository
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from app.schemas.pagination import PaginatedData
from app.core.exceptions import NotFoundException, ConflictException, BusinessRuleException


class SubjectService:
    def __init__(self, db: Session, subject_repo: SubjectRepository, department_repo: DepartmentRepository):
        self.db = db
        self.subject_repo = subject_repo
        self.department_repo = department_repo

    def get_subjects(
        self,
        page: int,
        page_size: int,
        q: str | None = None,
        department_id: UUID | None = None,
    ) -> PaginatedData[SubjectResponse]:
        search = q.strip() if q else None
        if department_id is not None:
            self._validate_department(department_id)
        skip = (page - 1) * page_size
        items = self.subject_repo.get_all(skip, page_size, search, department_id)
        total = self.subject_repo.get_count(search, department_id)
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def get_subject(self, subject_id: UUID) -> Subject:
        subject = self.subject_repo.get_by_id(subject_id)
        if not subject:
            raise NotFoundException(resource_name="Subject")
        return subject

    def _validate_department(self, department_id: UUID) -> None:
        department = self.department_repo.get_by_id(department_id)
        if not department:
            raise NotFoundException(resource_name="Department")

    def _validate_uniqueness(self, department_id: UUID, name: str, subject_code: str, exclude_subject_id: UUID | None = None) -> None:
        existing_by_name = self.subject_repo.get_by_department_and_name(department_id, name)
        if existing_by_name and existing_by_name.id != exclude_subject_id:
            raise ConflictException(detail=f"Subject with name '{name}' already exists in this department.")
            
        existing_by_code = self.subject_repo.get_by_department_and_code(department_id, subject_code)
        if existing_by_code and existing_by_code.id != exclude_subject_id:
            raise ConflictException(detail=f"Subject with code '{subject_code}' already exists in this department.")

    def create_subject(self, data: SubjectCreate) -> Subject:
        self._validate_department(data.department_id)
        self._validate_uniqueness(data.department_id, data.name, data.subject_code)

        subject = Subject(
            name=data.name,
            subject_code=data.subject_code,
            department_id=data.department_id
        )

        try:
            self.subject_repo.create(subject)
            self.db.commit()
            self.db.refresh(subject)
            return subject
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_subject(self, subject_id: UUID, data: SubjectUpdate) -> Subject:
        subject = self.get_subject(subject_id)

        # Update department_id if provided
        new_department_id = data.department_id or subject.department_id
        if data.department_id and data.department_id != subject.department_id:
            self._validate_department(data.department_id)

        new_name = data.name or subject.name
        new_code = data.subject_code or subject.subject_code
        
        # Re-validate uniqueness if anything changed
        if data.name or data.subject_code or data.department_id:
            self._validate_uniqueness(new_department_id, new_name, new_code, exclude_subject_id=subject.id)

        if data.name:
            subject.name = data.name
        if data.subject_code:
            subject.subject_code = data.subject_code
        if data.department_id:
            subject.department_id = data.department_id

        try:
            self.db.commit()
            self.db.refresh(subject)
            return subject
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def delete_subject(self, subject_id: UUID) -> None:
        subject = self.get_subject(subject_id)
        
        # Check if subject has exams to prevent deletion (business logic mirroring DB RESTRICT)
        if subject.exams:
            raise BusinessRuleException(detail="Cannot delete subject because it has assigned exams.")

        try:
            self.subject_repo.delete(subject)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BusinessRuleException(
                detail=f"Cannot delete subject '{subject.name}' because it has active dependencies."
            )
        except SQLAlchemyError:
            self.db.rollback()
            raise

