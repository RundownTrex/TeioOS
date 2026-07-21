from datetime import date
from sqlalchemy.orm import Session

from app.repositories.student_repository import StudentRepository
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.repositories.session_repository import SessionRepository
from app.core.security import create_exam_token
from app.core.exceptions import AuthenticationException, BusinessRuleException, ValidationException
from app.schemas.token import Token


class StudentAuthService:
    def __init__(
        self,
        db: Session,
        student_repo: StudentRepository,
        schedule_repo: ExamScheduleRepository,
        session_repo: SessionRepository,
    ):
        self.db = db
        self.student_repo = student_repo
        self.schedule_repo = schedule_repo
        self.session_repo = session_repo

    def authenticate_student(self, roll_number: str, raw_dob: str) -> Token:
        """
        Kiosk-style all-in-one authentication.
        Verifies credentials, checks for an active exam schedule, creates the
        session, and returns an Elevated Exam Token.
        """
        # 1. Verify Student
        student = self.student_repo.get_by_roll_number(roll_number)
        if not student:
            raise AuthenticationException("Incorrect roll number or date of birth")

        # 2. Verify Password (DOB)
        try:
            parsed_dob = date.fromisoformat(raw_dob)
        except ValueError:
            raise ValidationException("Invalid date format. Expected YYYY-MM-DD.")

        if student.date_of_birth != parsed_dob:
            raise AuthenticationException("Incorrect roll number or date of birth")

        # 3. Verify Assigned Exam & Active Schedule
        active_schedule = self.schedule_repo.get_active_schedule_for_student(student.id)
        if not active_schedule:
            raise BusinessRuleException("No active exams found for this student right now")

        # 4. Create or Retrieve ExamSession
        session = self.session_repo.get_or_create_session(
            student_id=student.id,
            schedule_id=active_schedule.id,
        )

        # Service owns the transaction boundary
        try:
            self.db.commit()
            self.db.refresh(session)
        except Exception as e:
            self.db.rollback()
            raise e

        # 5. Issue Elevated JWT
        access_token = create_exam_token(
            subject=str(student.id),
            role="student",
            exam_session_id=str(session.id),
            exam_schedule_id=str(active_schedule.id),
        )

        return Token(access_token=access_token, token_type="bearer")

