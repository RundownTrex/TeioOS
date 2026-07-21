from typing import Annotated
from fastapi import Query, Depends

class SearchParams:
    """
    Reusable dependency for extracting a standard search query.
    Used for generic text searches across supported columns.
    """
    def __init__(
        self,
        q: str | None = Query(None, alias="search", description="Search keyword"),
    ):
        self.search_query = q

# Type alias for easy injection in route definitions
SearchDep = Annotated[SearchParams, Depends()]
