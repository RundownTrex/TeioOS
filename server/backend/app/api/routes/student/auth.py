from typing import Annotated
from fastapi import APIRouter, Depends, status

from app.api.dependencies.database import SessionDep, OAuth2FormDep
from app.api.dependencies.auth import require_student
from app.api.dependencies.services import StudentAuthServiceDep
from app.schemas.response import APIResponse
from app.schemas.token import Token, TokenPayload
from app.schemas.user import StudentSessionInfo

router = APIRouter()


@router.post("/login", response_model=APIResponse[Token])
def login_student(
    form_data: OAuth2FormDep,
    auth_service: StudentAuthServiceDep,
) -> APIResponse[Token]:
    """
    Authenticate a student using Roll Number (username) and DOB (password).
    This endpoint verifies credentials and returns a Base Student JWT.
    It does not grant access to exam questions. The student must explicitly
    start an exam to receive an Elevated Exam Token.
    """
    token = auth_service.authenticate_student(
        roll_number=form_data.username,
        password=form_data.password,
    )
    return APIResponse(
        success=True,
        message="Login successful",
        data=token
    )


@router.get("/me", response_model=APIResponse[StudentSessionInfo])
def get_student_session_info(
    token_payload: Annotated[TokenPayload, Depends(require_student)],
) -> APIResponse[StudentSessionInfo]:
    """
    Protected endpoint.
    Only students can access this. Returns the contents of their stateless JWT.
    """
    info = StudentSessionInfo(
        user_id=token_payload.sub,
        role=token_payload.role,
        active_exam_session=token_payload.exam_session_id,
        active_exam_schedule=token_payload.exam_schedule_id,
    )
    return APIResponse(
        success=True,
        message="Session info retrieved successfully",
        data=info
    )

