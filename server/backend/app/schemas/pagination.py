from typing import Generic, TypeVar, Sequence
from pydantic import BaseModel, computed_field

T = TypeVar("T")

class PaginatedData(BaseModel, Generic[T]):
    """
    Standard schema for paginated responses.
    """
    items: Sequence[T]
    total: int
    page: int
    page_size: int

    @computed_field
    def pages(self) -> int:
        """Total number of pages based on total items and page size."""
        if self.page_size <= 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size

    @computed_field
    def has_next(self) -> bool:
        """Whether there is a subsequent page."""
        return self.page < self.pages

    @computed_field
    def has_previous(self) -> bool:
        """Whether there is a preceding page."""
        return self.page > 1
