from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.models.student_exam import StudentExam
from app.repositories.student_exam_repository import StudentExamRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.repositories.class_repository import ClassRepository
from app.schemas.student_exam import StudentAssignmentCreate, StudentAssignmentUpdate
from app.schemas.pagination import PaginatedData
from app.core.exceptions import NotFoundException, ConflictException

class StudentExamService:
    def __init__(
        self, 
        db: Session, 
        student_exam_repo: StudentExamRepository, 
        student_repo: StudentRepository,
        schedule_repo: ExamScheduleRepository,
        class_repo: ClassRepository,
    ):
        self.db = db
        self.student_exam_repo = student_exam_repo
        self.student_repo = student_repo
        self.schedule_repo = schedule_repo
        self.class_repo = class_repo

    def get_assigned_students(self, schedule_id: UUID, page: int, page_size: int) -> PaginatedData[StudentExam]:
        # Validate schedule exists
        if not self.schedule_repo.get_by_id(schedule_id):
            raise NotFoundException(resource_name="ExamSchedule")
            
        skip = (page - 1) * page_size
        items = self.student_exam_repo.get_all_for_schedule(schedule_id, skip, page_size)
        total = self.student_exam_repo.get_count_for_schedule(schedule_id)
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def assign_student(self, schedule_id: UUID, data: StudentAssignmentCreate) -> StudentExam:
        # Validate schedule exists
        if not self.schedule_repo.get_by_id(schedule_id):
            raise NotFoundException(resource_name="ExamSchedule")
            
        # Validate student exists
        if not self.student_repo.get_by_id(data.student_id):
            raise NotFoundException(resource_name="Student")
            
        # Prevent duplicate assignment
        if self.student_exam_repo.get_by_ids(data.student_id, schedule_id):
            raise ConflictException(detail="Student is already assigned to this exam schedule.")
            
        student_exam = StudentExam(
            student_id=data.student_id,
            exam_schedule_id=schedule_id,
            individual_duration_minutes=data.individual_duration_minutes,
        )
        
        try:
            self.student_exam_repo.create(student_exam)
            self.db.commit()
            self.db.refresh(student_exam)
            return student_exam
        except IntegrityError:
            self.db.rollback()
            raise ConflictException(detail="Assignment already exists or invalid references.")
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_assignment(self, schedule_id: UUID, student_id: UUID, data: StudentAssignmentUpdate) -> StudentExam:
        """Update an existing assignment. Currently supports the per-student
        exam time override (individual_duration_minutes)."""
        student_exam = self.student_exam_repo.get_by_ids(student_id, schedule_id)
        if not student_exam:
            raise NotFoundException(resource_name="StudentAssignment")

        if data.individual_duration_minutes is not None:
            student_exam.individual_duration_minutes = data.individual_duration_minutes

        try:
            self.db.commit()
            self.db.refresh(student_exam)
            return student_exam
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def assign_class(self, schedule_id: UUID, class_id: UUID) -> dict:
        """Assign all active students of a class to the schedule in one call.

        Existing assignments are skipped, never duplicated. Returns the number
        of newly assigned and already-assigned students.
        """
        if not self.schedule_repo.get_by_id(schedule_id):
            raise NotFoundException(resource_name="ExamSchedule")
        if not self.class_repo.get_by_id(class_id):
            raise NotFoundException(resource_name="Class")

        students = self.student_repo.get_active_by_class(class_id)
        assigned = 0
        skipped = 0
        for student in students:
            if self.student_exam_repo.get_by_ids(student.id, schedule_id):
                skipped += 1
                continue
            self.student_exam_repo.create(
                StudentExam(student_id=student.id, exam_schedule_id=schedule_id)
            )
            assigned += 1

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ConflictException(detail="Assignment already exists or invalid references.")
        except SQLAlchemyError:
            self.db.rollback()
            raise

        return {"assigned": assigned, "skipped": skipped}

    def remove_assignment(self, schedule_id: UUID, student_id: UUID) -> None:
        student_exam = self.student_exam_repo.get_by_ids(student_id, schedule_id)
        if not student_exam:
            raise NotFoundException(resource_name="StudentAssignment")
            
        try:
            self.student_exam_repo.delete(student_exam)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise
