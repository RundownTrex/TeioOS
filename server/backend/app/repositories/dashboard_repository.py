from typing import Sequence, Dict
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.models.student import Student
from app.models.exam import Exam
from app.models.exam_schedule import ExamSchedule
from app.models.result import Result
from app.models.exam_session import ExamSession

class DashboardRepository:
    """
    Data access layer for Dashboard statistics.
    Executes highly optimized raw SQL aggregations.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_student_count(self) -> int:
        stmt = select(func.count()).select_from(Student)
        return self.session.execute(stmt).scalar_one()

    def get_exam_count(self) -> int:
        stmt = select(func.count()).select_from(Exam)
        return self.session.execute(stmt).scalar_one()

    def get_schedule_counts_by_status(self) -> Dict[str, int]:
        """
        Returns a dictionary mapping ExamScheduleStatus (as string) to count.
        Executes a single GROUP BY query.
        """
        stmt = select(ExamSchedule.status, func.count(ExamSchedule.id)).group_by(ExamSchedule.status)
        results = self.session.execute(stmt).all()
        return {status.value: count for status, count in results}

    def get_average_score(self) -> float:
        """
        Returns the average percentage score across all results.
        Returns 0.0 if there are no results.
        """
        stmt = select(func.avg(Result.percentage))
        avg_score = self.session.execute(stmt).scalar_one_or_none()
        return float(avg_score) if avg_score is not None else 0.0

    def get_recent_activity(self, limit: int = 5) -> Sequence[Result]:
        """
        Returns the most recently published results to act as the activity feed.
        Eagerly loads student and exam context to prevent N+1 queries.
        """
        stmt = (
            select(Result)
            .options(
                joinedload(Result.exam_session).joinedload(ExamSession.student),
                joinedload(Result.exam_session).joinedload(ExamSession.exam_schedule).joinedload(ExamSchedule.exam)
            )
            .order_by(Result.published_at.desc().nulls_last())
            .limit(limit)
        )
        return self.session.execute(stmt).scalars().all()
