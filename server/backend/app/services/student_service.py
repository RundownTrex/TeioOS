from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.student import Student
from app.repositories.student_repository import StudentRepository
from app.repositories.class_repository import ClassRepository
from app.schemas.student import StudentCreate, StudentUpdate
from app.schemas.pagination import PaginatedData
from app.core.exceptions import ConflictException, NotFoundException
from app.core.security import get_password_hash

class StudentService:
    def __init__(
        self,
        db: Session,
        student_repo: StudentRepository,
        class_repo: ClassRepository,
    ):
        self.db = db
        self.student_repo = student_repo
        self.class_repo = class_repo

    def get_students(self, page: int, page_size: int) -> PaginatedData[Student]:
        skip = (page - 1) * page_size
        items = self.student_repo.get_all(skip, page_size)
        total = self.student_repo.get_count()
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def get_student(self, student_id: UUID) -> Student:
        student = self.student_repo.get_by_id(student_id)
        if not student:
            raise NotFoundException(resource_name="Student")
        return student

    def _validate_class(self, class_id: UUID) -> None:
        class_obj = self.class_repo.get_by_id(class_id)
        if not class_obj:
            raise NotFoundException(resource_name="Class")

    def _check_roll_number_collision(self, roll_number: str) -> None:
        existing = self.student_repo.get_by_roll_number(roll_number)
        if existing:
            raise ConflictException(detail="Roll number already exists")

    def create_student(self, data: StudentCreate) -> Student:
        self._validate_class(data.class_id)
        self._check_roll_number_collision(data.roll_number)
        
        student = Student(
            roll_number=data.roll_number,
            name=data.name,
            date_of_birth=data.date_of_birth,
            class_id=data.class_id,
            password_hash=get_password_hash(str(data.date_of_birth)),
            is_active=True
        )
        try:
            self.student_repo.create(student)
            self.db.commit()
            self.db.refresh(student)
            return student
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_student(self, student_id: UUID, data: StudentUpdate) -> Student:
        student = self.get_student(student_id)
        
        # If class is changing, validate it exists
        if data.class_id and data.class_id != student.class_id:
            self._validate_class(data.class_id)
            
        # Check collision if roll number changes
        if data.roll_number and data.roll_number != student.roll_number:
            self._check_roll_number_collision(data.roll_number)
            
        if data.roll_number:
            student.roll_number = data.roll_number
        if data.name:
            student.name = data.name
        if data.date_of_birth:
            student.date_of_birth = data.date_of_birth
            student.password_hash = get_password_hash(str(data.date_of_birth))
        if data.class_id:
            student.class_id = data.class_id
        if data.is_active is not None:
            student.is_active = data.is_active

        try:
            self.db.commit()
            self.db.refresh(student)
            return student
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def delete_student(self, student_id: UUID) -> None:
        student = self.get_student(student_id)
        try:
            self.student_repo.delete(student)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise
