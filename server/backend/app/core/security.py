from datetime import datetime, timedelta, timezone
from typing import Any
import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from app.core.config import settings

# Configure pwdlib to use Argon2id for secure password hashing
password_hash = PasswordHash((Argon2Hasher(),))


def get_password_hash(password: str) -> str:
    """
    Generate a secure hash from a plain text password using Argon2id.
    """
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.
    """
    return password_hash.verify(plain_password, hashed_password)


def _create_jwt(
    subject: str,
    role: str,
    additional_claims: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Internal helper to generate a JWT access token.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode: dict[str, Any] = {"exp": expire, "sub": str(subject), "role": role}

    if additional_claims:
        to_encode.update(additional_claims)

    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_login_token(subject: str, role: str, expires_delta: timedelta | None = None) -> str:
    """
    Create a base login token (Dashboard Access).
    """
    return _create_jwt(subject=subject, role=role, expires_delta=expires_delta)


def create_exam_token(
    subject: str,
    role: str,
    exam_session_id: str,
    exam_schedule_id: str,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create an elevated exam token containing the active exam session and schedule context.
    """
    additional_claims = {
        "exam_session_id": str(exam_session_id),
        "exam_schedule_id": str(exam_schedule_id),
    }
    return _create_jwt(
        subject=subject,
        role=role,
        additional_claims=additional_claims,
        expires_delta=expires_delta,
    )

