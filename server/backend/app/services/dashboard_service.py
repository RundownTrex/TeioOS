from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import DashboardStatsResponse
from app.models.exam_schedule import ExamScheduleStatus

class DashboardService:
    def __init__(self, dashboard_repo: DashboardRepository):
        self.dashboard_repo = dashboard_repo

    def get_dashboard_stats(self) -> DashboardStatsResponse:
        total_students = self.dashboard_repo.get_student_count()
        total_exams = self.dashboard_repo.get_exam_count()
        schedule_counts = self.dashboard_repo.get_schedule_counts_by_status()
        average_score = self.dashboard_repo.get_average_score()
        recent_activity = self.dashboard_repo.get_recent_activity(limit=5)

        upcoming_exams = schedule_counts.get(ExamScheduleStatus.SCHEDULED.value, 0)
        active_exams = schedule_counts.get(ExamScheduleStatus.ACTIVE.value, 0)
        completed_exams = schedule_counts.get(ExamScheduleStatus.COMPLETED.value, 0)

        return DashboardStatsResponse(
            total_students=total_students,
            total_exams=total_exams,
            upcoming_exams=upcoming_exams,
            active_exams=active_exams,
            completed_exams=completed_exams,
            average_score=average_score,
            recent_activity=list(recent_activity)
        )
