from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.models.department import Department
from app.repositories.department_repository import DepartmentRepository
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from app.schemas.pagination import PaginatedData
from app.core.exceptions import ConflictException, NotFoundException, BusinessRuleException

class DepartmentService:
    def __init__(self, db: Session, department_repo: DepartmentRepository):
        self.db = db
        self.department_repo = department_repo

    def get_departments(self, page: int, page_size: int) -> PaginatedData[Department]:
        skip = (page - 1) * page_size
        items = self.department_repo.get_all(skip, page_size)
        total = self.department_repo.get_count()
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def get_department(self, department_id: UUID) -> Department:
        department = self.department_repo.get_by_id(department_id)
        if not department:
            raise NotFoundException(resource_name="Department")
        return department

    def create_department(self, data: DepartmentCreate) -> Department:
        existing = self.department_repo.get_by_name(data.name)
        if existing:
            raise ConflictException(detail="Department name already exists")
        
        department = Department(name=data.name)
        try:
            self.department_repo.create(department)
            self.db.commit()
            self.db.refresh(department)
            return department
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_department(self, department_id: UUID, data: DepartmentUpdate) -> Department:
        department = self.get_department(department_id)

        if data.name and data.name != department.name:
            existing = self.department_repo.get_by_name(data.name)
            if existing:
                raise ConflictException(detail="Department name already exists")
            department.name = data.name

        try:
            self.db.commit()
            self.db.refresh(department)
            return department
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def delete_department(self, department_id: UUID) -> None:
        department = self.get_department(department_id)

        for subject in department.subjects:
            if subject.exams:
                raise BusinessRuleException(
                    detail=f"Cannot delete department '{department.name}' because subject '{subject.name}' has assigned exams."
                )

        for class_obj in department.classes:
            if class_obj.students:
                raise BusinessRuleException(
                    detail=f"Cannot delete department '{department.name}' because class '{class_obj.name}' has enrolled students."
                )

        try:
            self.department_repo.delete(department)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BusinessRuleException(
                detail=f"Cannot delete department '{department.name}' because it has active dependencies."
            )
        except SQLAlchemyError:
            self.db.rollback()
            raise

