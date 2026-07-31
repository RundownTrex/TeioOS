import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session


from app.models.student_exam import StudentExam, AssignmentStatus
from app.models.exam_schedule import ExamSchedule, ExamScheduleStatus
from app.repositories.student_exam_repository import StudentExamRepository
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.core.security import create_exam_token
from app.schemas.student_exam_delivery import ExamStartResponse, ExamSubmitConfirmation
from app.core.exceptions import BusinessRuleException, AuthorizationException
from app.services.result_calculation_service import ResultCalculationService


class ExamSessionService:
    def __init__(
        self,
        db: Session,
        assignment_repo: StudentExamRepository,
        schedule_repo: ExamScheduleRepository,
        result_calc_service: ResultCalculationService,
    ):
        self.db = db
        self.assignment_repo = assignment_repo
        self.schedule_repo = schedule_repo
        self.result_calc_service = result_calc_service

    def get_assigned_schedules(self, student_id: uuid.UUID) -> list[ExamSchedule]:
        """Get all active schedules assigned to the student."""
        return self.schedule_repo.get_active_schedules_for_student_list(student_id)

    def get_schedule_instructions(self, student_id: uuid.UUID, schedule_id: uuid.UUID) -> ExamSchedule:
        schedule = self.schedule_repo.get_by_id_with_details(schedule_id)
        if not schedule:
            raise BusinessRuleException("Exam schedule not found")

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
        
        - Validates the student is assigned to the schedule.
        - Validates the current time is within the exam availability window
          (schedule.start_time .. schedule.end_time).
        - Finds or creates the ExamAssignment (StudentExam) for this student+schedule.
        - If a session already exists:
            - IN_PROGRESS: resume it (never recompute expires_at).
            - PENDING: transition to IN_PROGRESS, set started_at and expires_at.
            - SUBMITTED / AUTO_SUBMITTED / EXPIRED / TERMINATED: reject.
        - If no assignment exists: create one with started_at = now and
          expires_at = now + exam.duration_minutes.
        - Returns an elevated exam token and the individual session expires_at.
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

        # --- Validate exam availability window ---
        if current_time < schedule.start_time:
            raise BusinessRuleException("The exam has not started yet")
        if current_time > schedule.end_time:
            raise BusinessRuleException("The exam availability window has closed")

        try:
            # 1. Retrieve existing assignment (which tracks the session)
            assignment = self.assignment_repo.get_by_student_and_schedule(student_id, schedule_id)

            if assignment:
                # --- Existing assignment found ---
                # Expiry is server-authoritative and must be checked before resume.
                if (
                    assignment.status == AssignmentStatus.IN_PROGRESS
                    and assignment.expires_at is not None
                    and current_time >= assignment.expires_at
                ):
                    assignment.status = AssignmentStatus.EXPIRED
                    assignment.last_activity_at = current_time
                    self.db.commit()
                    raise BusinessRuleException("Exam session has expired")

                if assignment.status == AssignmentStatus.IN_PROGRESS:
                    # Resume: never recompute expires_at
                    assignment.last_activity_at = current_time
                    assignment.resume_count += 1

                elif assignment.status == AssignmentStatus.PENDING:
                    # First actual start: set timers
                    exam_duration = timedelta(minutes=schedule.exam.duration_minutes)
                    assignment.started_at = current_time
                    assignment.expires_at = current_time + exam_duration
                    assignment.last_activity_at = current_time
                    assignment.resume_count = 1
                    assignment.status = AssignmentStatus.IN_PROGRESS

                elif assignment.status in (
                    AssignmentStatus.SUBMITTED,
                    AssignmentStatus.AUTO_SUBMITTED,
                ):
                    raise BusinessRuleException("Exam has already been submitted")

                elif assignment.status == AssignmentStatus.EXPIRED:
                    raise BusinessRuleException("Exam session has expired")

                elif assignment.status == AssignmentStatus.TERMINATED:
                    raise BusinessRuleException("Exam session has been terminated")

                else:
                    raise BusinessRuleException(f"Cannot start session in state: {assignment.status}")

            else:
                # --- No existing assignment — first time starting ---
                exam_duration = timedelta(minutes=schedule.exam.duration_minutes)
                assignment = StudentExam(
                    student_id=student_id,
                    exam_schedule_id=schedule_id,
                    started_at=current_time,
                    expires_at=current_time + exam_duration,
                    last_activity_at=current_time,
                    resume_count=1,
                    status=AssignmentStatus.IN_PROGRESS,
                )
                self.db.add(assignment)

            self.db.commit()
            self.db.refresh(assignment)

        except Exception:
            self.db.rollback()
            raise

        # 2. Issue Elevated Exam Token with expiry tied to session remaining time
        remaining = assignment.expires_at - datetime.now(timezone.utc)
        token_expiry = max(remaining, timedelta(minutes=5))

        access_token = create_exam_token(
            subject=str(student_id),
            role="student",
            exam_session_id=str(assignment.id),
            exam_schedule_id=str(schedule.id),
            expires_delta=token_expiry,
        )

        return ExamStartResponse(
            access_token=access_token,
            exam_session_id=assignment.id,
            server_current_time=datetime.now(timezone.utc),
            expires_at=assignment.expires_at,
        )

    def submit_exam(
        self, 
        student_id: uuid.UUID, 
        schedule_id: uuid.UUID,
        is_auto_submit: bool = False
    ) -> ExamSubmitConfirmation:
        """
        Submits the exam session (manual or auto).
        
        - Locks the assignment row via SELECT FOR UPDATE.
        - Rejects submissions after the individual session timer (expires_at) has elapsed.
        - Rejects submissions for already-submitted or expired sessions.
        - Calculates results synchronously in the same transaction.
        """
        try:
            from sqlalchemy import select
            from sqlalchemy.orm import joinedload
            stmt = select(StudentExam).options(
                joinedload(StudentExam.exam_schedule).joinedload(ExamSchedule.exam)
            ).where(
                StudentExam.student_id == student_id,
                StudentExam.exam_schedule_id == schedule_id
            ).with_for_update(of=StudentExam)

            assignment = self.db.scalars(stmt).first()
            if not assignment:
                raise BusinessRuleException("Session not found")

            if assignment.status in (AssignmentStatus.SUBMITTED, AssignmentStatus.AUTO_SUBMITTED):
                raise BusinessRuleException("Exam is already submitted")

            if assignment.status not in (AssignmentStatus.IN_PROGRESS,):
                raise BusinessRuleException("Exam session is not in progress")

            current_time = datetime.now(timezone.utc)

            # --- Reject submission if the individual timer has expired ---
            if assignment.expires_at and current_time > assignment.expires_at:
                assignment.status = AssignmentStatus.EXPIRED
                assignment.last_activity_at = current_time
                self.db.commit()
                raise BusinessRuleException(
                    "Cannot submit — the individual exam timer has already expired"
                )

            is_auto = is_auto_submit

            if is_auto:
                assignment.status = AssignmentStatus.AUTO_SUBMITTED
                assignment.is_auto_submitted = True
            else:
                assignment.status = AssignmentStatus.SUBMITTED
                assignment.is_auto_submitted = False

            assignment.submitted_at = current_time
            assignment.last_activity_at = current_time

            # Calculate result synchronously
            self.result_calc_service.calculate_for_session(assignment.id)

            self.db.commit()
            self.db.refresh(assignment)

            return ExamSubmitConfirmation(
                exam_session_id=assignment.id,
                status=assignment.status.value if hasattr(assignment.status, "value") else str(assignment.status),
                is_auto_submitted=assignment.is_auto_submitted,
                submitted_at=assignment.submitted_at,
                message="Exam submitted successfully" if not is_auto else "Exam auto-submitted successfully"
            )
        except Exception:
            self.db.rollback()
            raise
