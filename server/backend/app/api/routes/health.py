from fastapi import APIRouter

from app.schemas.response import APIResponse

router = APIRouter()


@router.get("/health", response_model=APIResponse[dict])
async def health_check():
    return APIResponse(
        success=True,
        message="Service is healthy",
        data={"status": "healthy"}
    )