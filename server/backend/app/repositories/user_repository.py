from typing import Sequence
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """
    Data access layer for User entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, user_id: UUID) -> User | None:
        stmt = select(User).where(User.id == user_id)
        return self.session.execute(stmt).scalars().first()

    def get_by_username(self, username: str) -> User | None:
        """
        Retrieves a user by their username.
        """
        stmt = select(User).where(User.username == username)
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20) -> Sequence[User]:
        stmt = select(User).order_by(User.username).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self) -> int:
        stmt = select(func.count()).select_from(User)
        return self.session.execute(stmt).scalar_one()

    def create(self, user: User) -> User:
        self.session.add(user)
        return user

    def delete(self, user: User) -> None:
        self.session.delete(user)
