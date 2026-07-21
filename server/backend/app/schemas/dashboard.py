from pydantic import BaseModel
from typing import List

from app.schemas.result import ResultResponse

class DashboardStatsResponse(BaseModel):
    total_students: int
    total_exams: int
    upcoming_exams: int
    active_exams: int
    completed_exams: int
    average_score: float
    recent_activity: List[ResultResponse]
