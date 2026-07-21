from datetime import date
from sqlalchemy.orm import Session

from app.repositories.student_repository import StudentRepository
from app.core.security import create_login_token, verify_password
from app.core.exceptions import AuthenticationException, BusinessRuleException
from app.schemas.token import Token


class StudentAuthService:
    def __init__(
        self,
        db: Session,
        student_repo: StudentRepository,
    ):
        self.db = db
        self.student_repo = student_repo

    def authenticate_student(self, roll_number: str, password: str) -> Token:
        """
        Base authentication for students.
        Verifies credentials (roll number and password) and returns a Base Student JWT.
        """
        # 1. Verify Student Exists
        student = self.student_repo.get_by_roll_number(roll_number)
        if not student:
            raise AuthenticationException("Incorrect roll number or password")

        # 2. Verify Student is Active
        if not student.is_active:
            raise BusinessRuleException("Student account is inactive")

        # 3. Verify Password
        if not student.password_hash or not verify_password(password, student.password_hash):
            raise AuthenticationException("Incorrect roll number or password")

        # 4. Issue Base JWT
        access_token = create_login_token(
            subject=str(student.id),
            role="student",
        )

        return Token(access_token=access_token, token_type="bearer")
