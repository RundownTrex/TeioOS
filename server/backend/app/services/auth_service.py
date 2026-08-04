from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, create_login_token
from app.core.exceptions import AuthenticationException
from app.schemas.token import Token


class AuthService:
    def __init__(self, db: Session, user_repo: UserRepository):
        self.db = db
        self.user_repo = user_repo

    def authenticate_admin(self, username: str, password: str) -> Token:
        """
        Authenticates an administrator.
        Returns a Token response if successful, otherwise raises AuthenticationException.
        """
        user = self.user_repo.get_by_username(username)

        # Allow active users in the users table (admin, teacher/professor) to log in
        if not user or not user.is_active:
            raise AuthenticationException("Incorrect username or password")

        if not verify_password(password, user.password_hash):
            raise AuthenticationException("Incorrect username or password")

        access_token = create_login_token(subject=str(user.id), role=user.role.value)
        return Token(access_token=access_token, token_type="bearer")

