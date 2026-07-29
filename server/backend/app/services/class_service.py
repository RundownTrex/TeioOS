from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.models.class_ import Class
from app.repositories.class_repository import ClassRepository
from app.repositories.department_repository import DepartmentRepository
from app.schemas.class_ import ClassCreate, ClassUpdate
from app.schemas.pagination import PaginatedData
from app.core.exceptions import ConflictException, NotFoundException, BusinessRuleException

class ClassService:
    def __init__(
        self, 
        db: Session, 
        class_repo: ClassRepository, 
        department_repo: DepartmentRepository
    ):
        self.db = db
        self.class_repo = class_repo
        self.department_repo = department_repo

    def get_classes(self, page: int, page_size: int) -> PaginatedData[Class]:
        skip = (page - 1) * page_size
        items = self.class_repo.get_all(skip, page_size)
        total = self.class_repo.get_count()
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def get_class(self, class_id: UUID) -> Class:
        class_obj = self.class_repo.get_by_id(class_id)
        if not class_obj:
            raise NotFoundException(resource_name="Class")
        return class_obj

    def _validate_department(self, department_id: UUID) -> None:
        department = self.department_repo.get_by_id(department_id)
        if not department:
            raise NotFoundException(resource_name="Department")

    def _check_name_collision(self, name: str, department_id: UUID) -> None:
        existing = self.class_repo.get_by_name_and_department(name, department_id)
        if existing:
            raise ConflictException(detail="Class name already exists in this department")

    def create_class(self, data: ClassCreate) -> Class:
        self._validate_department(data.department_id)
        self._check_name_collision(data.name, data.department_id)
        
        class_obj = Class(
            name=data.name,
            semester=data.semester,
            section=data.section,
            department_id=data.department_id
        )
        try:
            self.class_repo.create(class_obj)
            self.db.commit()
            self.db.refresh(class_obj)
            return class_obj
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_class(self, class_id: UUID, data: ClassUpdate) -> Class:
        class_obj = self.get_class(class_id)
        
        new_department_id = data.department_id or class_obj.department_id
        
        # If department is changing, validate it exists
        if data.department_id and data.department_id != class_obj.department_id:
            self._validate_department(data.department_id)
            
        # Check collision if name or department changes
        if (data.name and data.name != class_obj.name) or (data.department_id and data.department_id != class_obj.department_id):
            name_to_check = data.name or class_obj.name
            self._check_name_collision(name_to_check, new_department_id)
            
        if data.name:
            class_obj.name = data.name
        if data.semester:
            class_obj.semester = data.semester
        if data.section:
            class_obj.section = data.section
        if data.department_id:
            class_obj.department_id = data.department_id

        try:
            self.db.commit()
            self.db.refresh(class_obj)
            return class_obj
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def delete_class(self, class_id: UUID) -> None:
        class_obj = self.get_class(class_id)

        if class_obj.students:
            raise BusinessRuleException(
                detail=f"Cannot delete class '{class_obj.name}' because it has enrolled students."
            )

        try:
            self.class_repo.delete(class_obj)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BusinessRuleException(
                detail=f"Cannot delete class '{class_obj.name}' because it has active dependencies."
            )
        except SQLAlchemyError:
            self.db.rollback()
            raise
