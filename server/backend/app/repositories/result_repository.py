from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.result import Result
from app.models.student_exam import StudentExam
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
                joinedload(Result.student_exam).joinedload(StudentExam.student),
                joinedload(Result.student_exam).joinedload(StudentExam.exam_schedule).joinedload(ExamSchedule.exam)
            )
            .where(Result.id == result_id)
        )
        return self.session.execute(stmt).scalars().first()

    def _build_filter_query(
        self,
        student_id: UUID | None = None,
        exam_id: UUID | None = None,
        class_id: UUID | None = None,
        q: str | None = None,
        evaluation_status: str | None = None,
        is_published: bool | None = None,
    ):
        """Helper to build the base query with necessary joins for filtering."""
        from sqlalchemy import or_
        stmt = select(Result).join(Result.student_exam)

        if class_id or q:
            stmt = stmt.join(StudentExam.student)
            if class_id:
                stmt = stmt.where(Student.class_id == class_id)
            if q:
                stmt = stmt.where(
                    or_(
                        Student.name.ilike(f"%{q}%"),
                        Student.roll_number.ilike(f"%{q}%"),
                    )
                )

        if exam_id:
            stmt = stmt.join(StudentExam.exam_schedule).where(ExamSchedule.exam_id == exam_id)

        if student_id:
            stmt = stmt.where(StudentExam.student_id == student_id)

        if evaluation_status:
            stmt = stmt.where(Result.evaluation_status == evaluation_status)

        if is_published is not None:
            if is_published:
                stmt = stmt.where(Result.published_at.is_not(None))
            else:
                stmt = stmt.where(Result.published_at.is_(None))

        return stmt

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        student_id: UUID | None = None,
        exam_id: UUID | None = None,
        class_id: UUID | None = None,
        q: str | None = None,
        evaluation_status: str | None = None,
        is_published: bool | None = None,
    ) -> Sequence[Result]:
        stmt = self._build_filter_query(
            student_id=student_id,
            exam_id=exam_id,
            class_id=class_id,
            q=q,
            evaluation_status=evaluation_status,
            is_published=is_published,
        )

        stmt = stmt.options(
            joinedload(Result.student_exam).joinedload(StudentExam.student),
            joinedload(Result.student_exam).joinedload(StudentExam.exam_schedule).joinedload(ExamSchedule.exam)
        )

        stmt = stmt.order_by(Result.created_at.desc(), Result.id).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(
        self,
        student_id: UUID | None = None,
        exam_id: UUID | None = None,
        class_id: UUID | None = None,
        q: str | None = None,
        evaluation_status: str | None = None,
        is_published: bool | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(
            self._build_filter_query(
                student_id=student_id,
                exam_id=exam_id,
                class_id=class_id,
                q=q,
                evaluation_status=evaluation_status,
                is_published=is_published,
            ).subquery()
        )
        return self.session.execute(stmt).scalar_one()

    def get_by_student_exam_id(self, student_exam_id: UUID) -> Result | None:
        stmt = (
            select(Result)
            .options(
                joinedload(Result.student_exam).joinedload(StudentExam.student),
                joinedload(Result.student_exam).joinedload(StudentExam.exam_schedule).joinedload(ExamSchedule.exam)
            )
            .where(Result.student_exam_id == student_exam_id)
        )
        return self.session.execute(stmt).scalars().first()

    def update(self, result: Result) -> Result:
        self.session.add(result)
        return result

    def delete(self, result: Result) -> None:
        self.session.delete(result)

