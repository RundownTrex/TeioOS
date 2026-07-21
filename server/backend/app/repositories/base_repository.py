from typing import Generic, TypeVar, Sequence, Type
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.db.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)

class BaseRepository(Generic[ModelType]):
    """
    Generic repository providing base CRUD operations.
    """
    def __init__(self, model: Type[ModelType], session: Session):
        self.model = model
        self.session = session

    def get_by_id(self, id: UUID) -> ModelType | None:
        stmt = select(self.model).where(self.model.id == id)
        return self.session.execute(stmt).scalars().first()

    def get_all(self, skip: int = 0, limit: int = 20) -> Sequence[ModelType]:
        stmt = select(self.model).offset(skip).limit(limit)
        return self.session.execute(stmt).scalars().all()

    def get_count(self) -> int:
        stmt = select(func.count()).select_from(self.model)
        return self.session.execute(stmt).scalar_one()

    def create(self, obj: ModelType) -> ModelType:
        self.session.add(obj)
        return obj

    def update(self, obj: ModelType) -> ModelType:
        return obj

    def delete(self, obj: ModelType) -> None:
        self.session.delete(obj)
