from typing import Annotated
from fastapi import Query, Depends

class SortingParams:
    """
    Reusable dependency for extracting sorting parameters from the query string.
    Ensures safe constraints on sort_order (only asc or desc).
    """
    def __init__(
        self,
        sort_by: str | None = Query(None, description="Field to sort by"),
        sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order (asc or desc)"),
    ):
        self.sort_by = sort_by
        self.sort_order = sort_order

# Type alias for easy injection in route definitions
SortingDep = Annotated[SortingParams, Depends()]
