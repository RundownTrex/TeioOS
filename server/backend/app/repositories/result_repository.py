from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.result import Result
from app.models.exam_session import ExamSession
from app.models.exam_schedule import ExamSchedule
from app.models.student import Student


class ResultRepository:
    """
    Data access layer for Result entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, result_id: UUID) -> Result | None:
        stmt = (
            select(Result)
            .options(
                joinedload(Result.exam_session).joinedload(ExamSession.student),
                joinedload(Result.exam_session).joinedload(ExamSession.exam_schedule).joinedload(ExamSchedule.exam)
            )
            .where(Result.id == result_id)
        )
        return self.session.execute(stmt).scalars().first()

    def _build_filter_query(self, student_id: UUID | None = None, exam_id: UUID | None = None, class_id: UUID | None = None):
        """Helper to build the base query with necessary joins for filtering."""
        stmt = select(Result).join(Result.exam_session)
        
        if class_id:
            # Join Student to filter by class
            stmt = stmt.join(ExamSession.student).where(Student.class_id == class_id)
        
        if exam_id:
            # Join ExamSchedule to filter by exam
            stmt = stmt.join(ExamSession.exam_schedule).where(ExamSchedule.exam_id == exam_id)
            
        if student_id:
            stmt = stmt.where(ExamSession.student_id == student_id)
            
        return stmt

    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        student_id: UUID | None = None, 
        exam_id: UUID | None = None, 
        class_id: UUID | None = None
    ) -> Sequence[Result]:
        stmt = self._build_filter_query(student_id, exam_id, class_id)
        
        # Eager load relationships for the response
        stmt = stmt.options(
            joinedload(Result.exam_session).joinedload(ExamSession.student),
            joinedload(Result.exam_session).joinedload(ExamSession.exam_schedule).joinedload(ExamSchedule.exam)
        )
        
        stmt = stmt.order_by(Result.published_at.desc().nulls_last()).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(
        self, 
        student_id: UUID | None = None, 
        exam_id: UUID | None = None, 
        class_id: UUID | None = None
    ) -> int:
        stmt = select(func.count()).select_from(Result).join(Result.exam_session)
        
        if class_id:
            stmt = stmt.join(ExamSession.student).where(Student.class_id == class_id)
            
        if exam_id:
            stmt = stmt.join(ExamSession.exam_schedule).where(ExamSchedule.exam_id == exam_id)
            
        if student_id:
            stmt = stmt.where(ExamSession.student_id == student_id)
            
        return self.session.execute(stmt).scalar_one()

    # Create/Update/Delete are intentionally omitted from this API layer
    # as Results are managed internally by the exam submission lifecycle.
