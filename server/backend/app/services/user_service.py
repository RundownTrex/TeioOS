from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.pagination import PaginatedData
from app.core.exceptions import ConflictException, NotFoundException
from app.core.security import get_password_hash

class UserService:
    def __init__(self, db: Session, user_repo: UserRepository):
        self.db = db
        self.user_repo = user_repo

    def get_users(self, page: int, page_size: int) -> PaginatedData[User]:
        skip = (page - 1) * page_size
        items = self.user_repo.get_all(skip, page_size)
        total = self.user_repo.get_count()
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def get_user(self, user_id: UUID) -> User:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(resource_name="User")
        return user

    def _check_username_collision(self, username: str) -> None:
        existing = self.user_repo.get_by_username(username)
        if existing:
            raise ConflictException(detail="Username already exists")

    def create_user(self, data: UserCreate) -> User:
        self._check_username_collision(data.username)
        
        hashed_password = get_password_hash(data.password)
        
        user = User(
            username=data.username,
            password_hash=hashed_password,
            name=data.name,
            email=data.email,
            role=data.role
        )
        try:
            self.user_repo.create(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_user(self, user_id: UUID, data: UserUpdate) -> User:
        user = self.get_user(user_id)
        
        # Check collision if username changes
        if data.username and data.username != user.username:
            self._check_username_collision(data.username)
            
        if data.username:
            user.username = data.username
        if data.name:
            user.name = data.name
        if data.email:
            user.email = data.email
        if data.role:
            user.role = data.role
        if data.password:
            user.password_hash = get_password_hash(data.password)

        try:
            self.db.commit()
            self.db.refresh(user)
            return user
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def delete_user(self, user_id: UUID) -> None:
        user = self.get_user(user_id)
        try:
            self.user_repo.delete(user)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise
