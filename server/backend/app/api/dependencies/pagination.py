from typing import Annotated
from fastapi import Query, Depends

class PaginationParams:
    """
    Reusable dependency for extracting pagination parameters from the query string.
    Ensures safe constraints on page size and offsets.
    """
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number (1-indexed)"),
        page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    ):
        self.page = page
        self.page_size = page_size
        self.skip = (page - 1) * page_size
        self.limit = page_size

# Type alias for easy injection in route definitions
PaginationDep = Annotated[PaginationParams, Depends()]
