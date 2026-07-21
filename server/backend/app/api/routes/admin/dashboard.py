from fastapi import APIRouter, Depends

from app.api.dependencies.auth import require_admin
from app.api.dependencies.services import DashboardServiceDep
from app.schemas.dashboard import DashboardStatsResponse
from app.schemas.response import APIResponse

router = APIRouter()

@router.get("/", response_model=APIResponse[DashboardStatsResponse])
def get_dashboard_stats(
    dashboard_service: DashboardServiceDep,
    _=Depends(require_admin),
):
    """
    Retrieve aggregated statistics for the administration dashboard.
    Fetches totals, active schedules, and recent activity efficiently.
    """
    stats = dashboard_service.get_dashboard_stats()
    return APIResponse(
        success=True,
        message="Dashboard statistics retrieved successfully",
        data=stats,
    )
