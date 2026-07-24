import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session


from app.models.exam_session import ExamSession, SessionStatus
from app.models.exam_schedule import ExamSchedule, ExamScheduleStatus
from app.repositories.session_repository import SessionRepository
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.core.security import create_exam_token
from app.schemas.student_exam_delivery import ExamStartResponse, ExamSubmitConfirmation
from app.core.exceptions import BusinessRuleException, AuthorizationException
from app.services.result_calculation_service import ResultCalculationService


class ExamSessionService:
    def __init__(
        self,
        db: Session,
        session_repo: SessionRepository,
        schedule_repo: ExamScheduleRepository,
        result_calc_service: ResultCalculationService,
    ):
        self.db = db
        self.session_repo = session_repo
        self.schedule_repo = schedule_repo
        self.result_calc_service = result_calc_service

    def get_assigned_schedules(self, student_id: uuid.UUID) -> list[ExamSchedule]:
        """Get all active schedules assigned to the student."""
        # Using a custom query or relying on repo. For now we use the active ones.
        # This returns all schedules assigned to the student that are ACTIVE or SCHEDULED.
        return self.schedule_repo.get_active_schedules_for_student_list(student_id)

    def get_schedule_instructions(self, student_id: uuid.UUID, schedule_id: uuid.UUID) -> ExamSchedule:
        schedule = self.schedule_repo.get_by_id_with_details(schedule_id)
        if not schedule:
            raise BusinessRuleException("Exam schedule not found")
        
        # Verify student is assigned
        is_assigned = any(student.id == student_id for student in schedule.assigned_students)
        if not is_assigned:
            raise AuthorizationException("You are not assigned to this exam")
            
        return schedule

    def start_exam_session(
        self, 
        student_id: uuid.UUID, 
        schedule_id: uuid.UUID,
        machine_id: str | None = None,
        ip_address: str | None = None
    ) -> ExamStartResponse:
        """
        Single transaction to start or resume an exam session.
        """
        schedule = self.schedule_repo.get_by_id(schedule_id)
        if not schedule:
            raise BusinessRuleException("Exam schedule not found")
            
        if schedule.status not in (ExamScheduleStatus.ACTIVE, ExamScheduleStatus.SCHEDULED):
            raise BusinessRuleException("This exam is not currently active")

        is_assigned = any(student.id == student_id for student in schedule.assigned_students)
        if not is_assigned:
            raise AuthorizationException("You are not assigned to this exam")

        current_time = datetime.now(timezone.utc)
        if current_time < schedule.start_time:
            raise BusinessRuleException("The exam has not started yet")
        if current_time > schedule.end_time:
            raise BusinessRuleException("The exam has already ended")

        try:
            # 1. Retrieve existing session
            session = self.session_repo.get_by_student_and_schedule(student_id, schedule_id)
            
            if not session:
                # Create a new session in IN_PROGRESS state
                session = ExamSession(
                    student_id=student_id,
                    exam_schedule_id=schedule_id,
                    status=SessionStatus.IN_PROGRESS,
                    login_time=current_time,
                    start_time=current_time,
                    machine_id=machine_id,
                    ip_address=ip_address
                )
                self.db.add(session)
            else:
                if session.status in (SessionStatus.SUBMITTED, SessionStatus.AUTO_SUBMITTED):
                    raise BusinessRuleException("You have already submitted this exam")
                if session.status in (SessionStatus.EXPIRED, SessionStatus.TERMINATED):
                    raise BusinessRuleException("This exam session is closed")
                
                if session.status == SessionStatus.READY:
                    session.status = SessionStatus.IN_PROGRESS
                    session.start_time = current_time
                    session.login_time = current_time
                    session.machine_id = machine_id
                    session.ip_address = ip_address

            self.db.commit()
            self.db.refresh(session)
        except Exception:
            self.db.rollback()
            raise

        # 2. Issue Upgraded JWT
        access_token = create_exam_token(
            subject=str(student_id),
            role="student",
            exam_session_id=str(session.id),
            exam_schedule_id=str(schedule.id),
        )

        return ExamStartResponse(
            access_token=access_token,
            exam_session_id=session.id,
            server_current_time=datetime.now(timezone.utc),
            end_time=schedule.end_time
        )

    def submit_exam(
        self, 
        student_id: uuid.UUID, 
        schedule_id: uuid.UUID,
        is_auto_submit: bool = False
    ) -> ExamSubmitConfirmation:
        """
        Submits the exam session (manual or auto). 
        Locks the session row via SELECT FOR UPDATE, transitions state, 
        and calculates results in a single transaction.
        """
        try:
            from sqlalchemy import select
            from sqlalchemy.orm import joinedload
            stmt = select(ExamSession).options(
                joinedload(ExamSession.exam_schedule)
            ).where(
                ExamSession.student_id == student_id,
                ExamSession.exam_schedule_id == schedule_id
            ).with_for_update(of=ExamSession)
            
            session = self.db.scalars(stmt).first()
            if not session:
                raise BusinessRuleException("Session not found")
                
            if session.status in (SessionStatus.SUBMITTED, SessionStatus.AUTO_SUBMITTED):
                raise BusinessRuleException("Exam is already submitted")
                
            if session.status != SessionStatus.IN_PROGRESS:
                raise BusinessRuleException("Exam session is not in progress")

            current_time = datetime.now(timezone.utc)

            # Determine if auto-submitted based on flag or scheduled end time comparison
            is_auto = is_auto_submit or (current_time > session.exam_schedule.end_time)
            
            if is_auto:
                session.status = SessionStatus.AUTO_SUBMITTED
                session.is_auto_submitted = True
            else:
                session.status = SessionStatus.SUBMITTED
                session.is_auto_submitted = False
                
            session.submit_time = current_time

            # Calculate result synchronously (adds Result record to current db session)
            self.result_calc_service.calculate_for_session(session.id)
            
            self.db.commit()
            self.db.refresh(session)

            return ExamSubmitConfirmation(
                exam_session_id=session.id,
                status=session.status.value if hasattr(session.status, "value") else str(session.status),
                is_auto_submitted=session.is_auto_submitted,
                submitted_at=session.submit_time,
                message="Exam submitted successfully" if not is_auto else "Exam auto-submitted successfully"
            )
        except Exception:
            self.db.rollback()
            raise
