from app.api.dependencies.database import SessionDep, OAuth2FormDep
from app.api.dependencies.repositories import (
    UserRepoDep,
    StudentRepoDep,
    ExamRepoDep,
    ExamScheduleRepoDep,
    SessionRepoDep,
)
from app.api.dependencies.services import (
    AuthServiceDep,
    StudentAuthServiceDep,
    StudentServiceDep,
    ExamServiceDep,
)
from app.api.dependencies.auth import (
    get_current_user,
    require_admin,
    require_student,
    get_token_payload,
    get_active_exam_student,
)
from app.api.dependencies.pagination import PaginationDep, PaginationParams
from app.api.dependencies.filtering import BaseFilterParams
from app.api.dependencies.sorting import SortingDep, SortingParams
from app.api.dependencies.searching import SearchDep, SearchParams

__all__ = [
    # DB
    "SessionDep",
    "OAuth2FormDep",
    
    # Repositories
    "UserRepoDep",
    "StudentRepoDep",
    "ExamRepoDep",
    "ExamScheduleRepoDep",
    "SessionRepoDep",
    
    # Services
    "AuthServiceDep",
    "StudentAuthServiceDep",
    "StudentServiceDep",
    "ExamServiceDep",
    
    # Auth
    "get_current_user",
    "require_admin",
    "require_student",
    "get_token_payload",
    "get_active_exam_student",

    # Pagination
    "PaginationDep",
    "PaginationParams",

    # Filtering
    "BaseFilterParams",

    # Sorting
    "SortingDep",
    "SortingParams",

    # Searching
    "SearchDep",
    "SearchParams",
]
