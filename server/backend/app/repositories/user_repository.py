from typing import Sequence
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """
    Data access layer for User entities.
    Executes raw SQL queries via SQLAlchemy 2.0.
    No business logic or commits happen here.
    """

    def __init__(self, session: Session):
        super().__init__(User, session)

    def get_by_username(self, username: str) -> User | None:
        """
        Retrieves a user by their username.
        """
        stmt = select(User).where(User.username == username)
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20) -> Sequence[User]:
        stmt = select(User).order_by(User.username).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()
