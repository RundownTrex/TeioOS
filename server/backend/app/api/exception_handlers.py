from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi import status
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import (
    AuthenticationException,
    AuthorizationException,
    NotFoundException,
    ConflictException,
    ValidationException,
    BusinessRuleException,
    ExamUnavailableException,
    SessionExpiredException,
    SessionAlreadySubmittedException,
    SessionPausedException,
)
from app.schemas.response import APIResponse
import logging

logger = logging.getLogger("teioos.errors")

def add_exception_handlers(app: FastAPI) -> None:
    """
    Registers global exception handlers on the FastAPI app.
    This intercepts domain exceptions thrown by services and translates them
    into standardized JSON API responses.
    """

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Flatten Pydantic validation errors into a list of strings
        errors = [f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()]
        logger.warning(f"RequestValidationError at {request.url.path}: {errors}")
        response_model = APIResponse(
            success=False,
            message="Request validation failed",
            errors=errors
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(AuthenticationException)
    async def authentication_exception_handler(request: Request, exc: AuthenticationException):
        logger.warning(f"AuthenticationException at {request.url.path}: {exc.detail}")
        response_model = APIResponse(
            success=False,
            message="Authentication failed",
            errors=[exc.detail]
        )
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=response_model.model_dump(mode='json'),
            headers={"WWW-Authenticate": "Bearer"},
        )

    @app.exception_handler(AuthorizationException)
    async def authorization_exception_handler(request: Request, exc: AuthorizationException):
        logger.warning(f"AuthorizationException at {request.url.path}: {exc.detail}")
        response_model = APIResponse(
            success=False,
            message="Authorization failed",
            errors=[exc.detail]
        )
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(NotFoundException)
    async def not_found_exception_handler(request: Request, exc: NotFoundException):
        logger.warning(f"NotFoundException at {request.url.path}: {exc.detail}")
        response_model = APIResponse(
            success=False,
            message="Resource not found",
            errors=[exc.detail]
        )
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(ExamUnavailableException)
    async def exam_unavailable_exception_handler(request: Request, exc: ExamUnavailableException):
        logger.warning(f"ExamUnavailableException at {request.url.path}: {exc.detail}")
        response_model = APIResponse(
            success=False,
            message="Examination unavailable",
            errors=[exc.detail]
        )
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(SessionExpiredException)
    async def session_expired_exception_handler(request: Request, exc: SessionExpiredException):
        logger.warning(f"SessionExpiredException at {request.url.path}: {exc.detail}")
        response_model = APIResponse(
            success=False,
            message="Exam session expired",
            errors=[exc.detail]
        )
        return JSONResponse(
            status_code=status.HTTP_410_GONE,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(SessionAlreadySubmittedException)
    async def session_already_submitted_exception_handler(request: Request, exc: SessionAlreadySubmittedException):
        logger.warning(f"SessionAlreadySubmittedException at {request.url.path}: {exc.detail}")
        response_model = APIResponse(
            success=False,
            message="Exam already submitted",
            errors=[exc.detail]
        )
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(SessionPausedException)
    async def session_paused_exception_handler(request: Request, exc: SessionPausedException):
        logger.warning(f"SessionPausedException at {request.url.path}: {exc.detail}")
        response_model = APIResponse(
            success=False,
            message="Exam session paused",
            errors=[exc.detail]
        )
        return JSONResponse(
            status_code=status.HTTP_423_LOCKED,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(ConflictException)
    async def conflict_exception_handler(request: Request, exc: ConflictException):
        logger.warning(f"ConflictException at {request.url.path}: {exc.detail}")
        response_model = APIResponse(
            success=False,
            message="Resource conflict",
            errors=[exc.detail]
        )
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(ValidationException)
    async def domain_validation_exception_handler(request: Request, exc: ValidationException):
        logger.warning(f"ValidationException at {request.url.path}: {exc.detail}")
        response_model = APIResponse(
            success=False,
            message="Domain validation failed",
            errors=[exc.detail]
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(BusinessRuleException)
    async def business_rule_exception_handler(request: Request, exc: BusinessRuleException):
        logger.warning(f"BusinessRuleException at {request.url.path}: {exc.detail}")
        response_model = APIResponse(
            success=False,
            message=exc.detail or "Business rule violation",
            errors=[exc.detail] if exc.detail else ["Business rule violation"]
        )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(IntegrityError)
    async def integrity_exception_handler(request: Request, exc: IntegrityError):
        logger.warning(f"IntegrityError at {request.url.path}: {str(exc)}")
        response_model = APIResponse(
            success=False,
            message="Database integrity conflict",
            errors=["Operation failed due to database constraint restrictions or conflict."]
        )
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=response_model.model_dump(mode='json'),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled Exception at {request.url.path}: {str(exc)}", exc_info=True)
        response_model = APIResponse(
            success=False,
            message="Internal Server Error",
            errors=["An unexpected error occurred."]
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=response_model.model_dump(mode='json'),
        )

