from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic import ValidationError

from sqlalchemy.orm import Session
from app.core.config import settings
from app.schemas.token import TokenPayload
from app.db.session import get_db
from app.repositories.user_repository import UserRepository
from app.api.dependencies.repositories import get_user_repository
from app.models.user import User
from app.core.exceptions import AuthenticationException, AuthorizationException

# Explicitly named extractor to avoid OAuth2 Server confusion
# We use this merely to extract the Bearer token from the Authorization header.
# tokenUrl is required by OpenAPI, we can point it to a primary login route.
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


def get_token_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenPayload:
    """
    Decodes the JWT from Bearer authorization header, validates its signature and expiration statelessly,
    and returns the structured TokenPayload.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        token_data = TokenPayload(**payload)
    except jwt.ExpiredSignatureError:
        raise AuthenticationException("Token has expired")
    except (jwt.InvalidTokenError, ValidationError):
        raise AuthenticationException("Could not validate credentials")
    return token_data


class RoleChecker:
    """
    Reusable dependency factory for role-based authorization.
    Checks if the stateless token payload contains an allowed role.
    """
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, token_payload: TokenPayload = Depends(get_token_payload)) -> TokenPayload:
        if token_payload.role not in self.allowed_roles:
            raise AuthorizationException("Not enough permissions")
        return token_payload

# Instantiated reusable dependencies
require_admin = RoleChecker(["admin"])
require_student = RoleChecker(["student"])


def get_active_exam_student(token_payload: TokenPayload = Depends(require_student)) -> TokenPayload:
    """
    Validates that the student has an active Exam Token.
    Requires exam_session_id and exam_schedule_id to be present.
    """
    if not token_payload.exam_session_id or not token_payload.exam_schedule_id:
        raise AuthorizationException("Active exam session required")
    return token_payload


def get_current_user(
    token_payload: TokenPayload = Depends(require_admin),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    """
    Stateful dependency that retrieves the actual User model from the database.
    Used when you need user details beyond what is stored in the stateless JWT.
    """
    user = user_repo.get_by_id(token_payload.sub)
    if not user:
        raise AuthenticationException("User not found")
    return user
