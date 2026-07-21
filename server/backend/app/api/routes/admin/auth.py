from typing import Annotated
from fastapi import APIRouter, Depends, status

from app.api.dependencies.database import SessionDep, OAuth2FormDep
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.services import AuthServiceDep
from app.schemas.response import APIResponse
from app.schemas.token import Token
from app.schemas.user import AdminProfile
from app.models.user import User

router = APIRouter()

CurrentUserDep = Annotated[User, Depends(get_current_user)]


@router.post("/login", response_model=Token)
def login_admin(
    form_data: OAuth2FormDep,
    auth_service: AuthServiceDep,
) -> Token:
    """
    Authenticate an administrator using username and password.
    Returns a stateless JWT login token.
    Must return standard OAuth2 format so Swagger UI can parse it.
    """
    token = auth_service.authenticate_admin(
        username=form_data.username,
        password=form_data.password,
    )
    return token


@router.get("/me", response_model=APIResponse[AdminProfile])
def get_admin_profile(
    current_user: CurrentUserDep,
) -> APIResponse[AdminProfile]:
    """
    Protected endpoint.
    Retrieves the profile of the currently authenticated admin.
    """
    profile = AdminProfile(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.value,
    )
    return APIResponse(
        success=True,
        message="Profile retrieved successfully",
        data=profile
    )

