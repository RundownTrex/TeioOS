"""
Shared FastAPI dependency type aliases.

Centralised here so every route module imports from one place
instead of re-declaring identical Annotated types.
"""

from typing import Annotated
from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db

SessionDep = Annotated[Session, Depends(get_db)]
OAuth2FormDep = Annotated[OAuth2PasswordRequestForm, Depends()]
