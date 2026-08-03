from typing import Sequence
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
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

    def _apply_filters(self, stmt, search: str | None = None, role: UserRole | None = None):
        if role:
            stmt = stmt.where(User.role == role)
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    User.name.ilike(pattern),
                    User.username.ilike(pattern),
                    User.email.ilike(pattern),
                )
            )
        return stmt

    def get_all(
        self, skip: int = 0, limit: int = 20, search: str | None = None, role: UserRole | None = None
    ) -> Sequence[User]:
        stmt = select(User)
        stmt = self._apply_filters(stmt, search=search, role=role)
        stmt = stmt.order_by(User.name, User.username).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self, search: str | None = None, role: UserRole | None = None) -> int:
        stmt = select(func.count()).select_from(User)
        stmt = self._apply_filters(stmt, search=search, role=role)
        return self.session.execute(stmt).scalar_one()

