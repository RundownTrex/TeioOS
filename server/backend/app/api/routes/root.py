from fastapi import APIRouter

from app.schemas.response import APIResponse

router = APIRouter()

@router.get("/", response_model=APIResponse[dict])
async def root():
    return APIResponse(
        success=True,
        message="Welcome to TeioOS Exam Server",
        data={}
    )