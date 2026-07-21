from pydantic import BaseModel


class Token(BaseModel):
    """
    Response model for authentication endpoints returning a JWT.
    """
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """
    Base model for validating the decoded JWT payload.
    """
    sub: str
    role: str
    exp: int | None = None

    # Exam-specific fields, present in Exam Tokens but not Login Tokens
    exam_session_id: str | None = None
    exam_schedule_id: str | None = None

