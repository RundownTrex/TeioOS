import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session


from app.core.config import settings
from app.models.student_exam import StudentExam, AssignmentStatus
from app.models.exam_schedule import ExamSchedule, ExamScheduleStatus
from app.repositories.student_exam_repository import StudentExamRepository
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.core.security import create_exam_token
from app.schemas.student_exam_delivery import (
    ExamStartResponse,
    ExamSubmitConfirmation,
    ExamInstructionResponse,
    StudentAvailableExamResponse,
    ExamSessionResponse,
    ExamSessionSnapshotResponse,
    StudentResultInfo,
    OptionReviewItem,
    QuestionReviewItem,
    ExamReviewResponse,
)
from app.core.exceptions import (
    AuthorizationException,
    ExamUnavailableException,
    SessionExpiredException,
    SessionAlreadySubmittedException,
    SessionPausedException,
    BusinessRuleException,
)
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

    def _build_session_response(
        self, assignment: StudentExam | None, duration_minutes: int, total_marks: float | None = None
    ) -> ExamSessionResponse | None:
        """Serializes the candidate's personal exam session for the frontend."""
        if assignment is None:
            return None

        result_info = None
        if assignment.result:
            res = assignment.result
            is_pub = res.published_at is not None
            result_info = StudentResultInfo(
                is_published=is_pub,
                published_at=res.published_at if is_pub else None,
                obtained_marks=res.obtained_marks if is_pub else None,
                total_marks=total_marks if is_pub else None,
                percentage=res.percentage if is_pub else None,
                grade=res.grade if is_pub else None,
                evaluation_status=res.evaluation_status.value if res.evaluation_status else "PENDING",
            )

        return ExamSessionResponse(
            assignment_id=assignment.id,
            started_at=assignment.started_at,
            expires_at=assignment.expires_at,
            submitted_at=assignment.submitted_at,
            status=assignment.status.value,
            duration=duration_minutes,
            last_activity_at=assignment.last_activity_at,
            paused_at=assignment.paused_at,
            result=result_info,
        )

    def _lock_assignment(
        self, student_id: uuid.UUID, schedule_id: uuid.UUID
    ) -> StudentExam | None:
        """
        Locks the candidate's assignment row (SELECT ... FOR UPDATE) so pause,
        resume and submission transitions are serialized across requests.
        """
        stmt = (
            select(StudentExam)
            .where(
                StudentExam.student_id == student_id,
                StudentExam.exam_schedule_id == schedule_id,
            )
            .with_for_update(of=StudentExam)
        )
        return self.db.scalars(stmt).first()

    def _unpause(self, assignment: StudentExam, current_time: datetime) -> None:
        """
        Shifts the individual deadline forward by the pause duration so the
        candidate's timer continues from where it stopped. No-op when the
        session is not paused.
        """
        if assignment.paused_at is None:
            return
        if assignment.expires_at is not None:
            assignment.expires_at = assignment.expires_at + (
                current_time - assignment.paused_at
            )
        assignment.paused_at = None

    def get_assigned_exams(self, student_id: uuid.UUID) -> list[StudentAvailableExamResponse]:
        """
        Returns the exams assigned to the student together with their personal
        exam session (if one exists). All examination timing is derived from the
        session, never from the schedule's availability window.
        """
        schedules = self.schedule_repo.get_active_schedules_for_student_list(student_id)
        assignments = self.assignment_repo.get_by_student_and_schedules(
            student_id, [sched.id for sched in schedules]
        )
        assignment_map = {assignment.exam_schedule_id: assignment for assignment in assignments}

        data = []
        for sched in schedules:
            data.append(
                StudentAvailableExamResponse(
                    schedule_id=sched.id,
                    subject_name=sched.exam.subject.name,
                    subject_code=sched.exam.subject.subject_code,
                    department_name=sched.exam.subject.department.name,
                    duration_minutes=sched.exam.duration_minutes,
                    total_marks=sched.exam.total_marks,
                    status=sched.status,
                    start_time=sched.start_time,
                    end_time=sched.end_time,
                    session=self._build_session_response(
                        assignment_map.get(sched.id), sched.exam.duration_minutes, sched.exam.total_marks
                    ),
                )
            )
        return data

    def get_exam_instructions(
        self, student_id: uuid.UUID, schedule_id: uuid.UUID
    ) -> ExamInstructionResponse:
        """
        Returns instructions and the candidate's personal session (if one exists)
        for an exam before starting.
        """
        schedule = self.schedule_repo.get_by_id_with_details(schedule_id)
        if not schedule:
            raise ExamUnavailableException("Exam schedule not found")

        is_assigned = any(student.id == student_id for student in schedule.assigned_students)
        if not is_assigned:
            raise AuthorizationException("You are not assigned to this exam")

        assignment = self.assignment_repo.get_by_student_and_schedule(student_id, schedule_id)
        return ExamInstructionResponse(
            schedule_id=schedule.id,
            subject_name=schedule.exam.subject.name,
            subject_code=schedule.exam.subject.subject_code,
            department_name=schedule.exam.subject.department.name,
            duration_minutes=schedule.exam.duration_minutes,
            total_marks=schedule.exam.total_marks,
            start_time=schedule.start_time,
            end_time=schedule.end_time,
            status=schedule.status,
            session=self._build_session_response(assignment, schedule.exam.duration_minutes, schedule.exam.total_marks),
        )

    def get_exam_session(self, student_id: uuid.UUID, schedule_id: uuid.UUID) -> ExamSessionSnapshotResponse:
        """
        Returns the candidate's personal examination session as the single source
        of timing for the frontend, together with the authoritative server time
        used to calibrate the client countdown timer. A snapshot endpoint: it
        reports the current status (IN_PROGRESS, SUBMITTED, EXPIRED, ...) rather
        than rejecting it.
        """
        schedule = self.schedule_repo.get_by_id(schedule_id)
        if not schedule:
            raise ExamUnavailableException("Exam schedule not found")

        is_assigned = any(student.id == student_id for student in schedule.assigned_students)
        if not is_assigned:
            raise AuthorizationException("You are not assigned to this exam")

        assignment = self.assignment_repo.get_by_student_and_schedule(student_id, schedule_id)
        if assignment is None:
            raise ExamUnavailableException("Exam session has not been started")

        # Heartbeat: while the session is actively counting down, the periodic
        # snapshot poll from the exam workbench refreshes last_activity_at so
        # the inactivity-based pause fallback never fires for a present candidate.
        current_time = datetime.now(timezone.utc)
        if assignment.status == AssignmentStatus.IN_PROGRESS and assignment.paused_at is None:
            assignment.last_activity_at = current_time
            self.db.commit()

        session = self._build_session_response(assignment, schedule.exam.duration_minutes)
        return ExamSessionSnapshotResponse(
            server_current_time=current_time,
            **session.model_dump(),
        )

    def start_exam_session(
        self, 
        student_id: uuid.UUID, 
        schedule_id: uuid.UUID,
        machine_id: str | None = None,
        ip_address: str | None = None
    ) -> ExamStartResponse:
        """
        Starts or resumes an exam session. Server time only.

        ExamSchedule is the availability window: it decides who may BEGIN.
        ExamAssignment (StudentExam) owns the candidate timer: expires_at is
        computed on first start and only ever moved forward when a paused
        session is resumed (never backwards, never reset).

        - First start (no assignment, or a PENDING assignment never started):
            - Validate the schedule availability window (start_time..end_time).
            - Record started_at = now.
            - Compute expires_at = started_at + exam.duration_minutes.
            - Persist. expires_at is never recomputed afterwards.
        - Resume (existing IN_PROGRESS assignment):
            - If the session is paused, the individual deadline is shifted
              forward by the pause duration (time is only counted while the
              candidate is actively giving the exam).
            - Return the existing assignment; never create another.
            - Never reset the timer. If the individual timer has elapsed,
              the assignment is marked EXPIRED and the request is rejected.
        - SUBMITTED / AUTO_SUBMITTED / EXPIRED / TERMINATED: reject.
        - Returns an elevated exam token and the individual session expires_at.
        """
        schedule = self.schedule_repo.get_by_id(schedule_id)
        if not schedule:
            raise ExamUnavailableException("Exam schedule not found")

        if schedule.status == ExamScheduleStatus.CANCELLED:
            raise ExamUnavailableException("This exam has been cancelled")

        is_assigned = any(student.id == student_id for student in schedule.assigned_students)
        if not is_assigned:
            raise AuthorizationException("You are not assigned to this exam")

        current_time = datetime.now(timezone.utc)

        assignment = self.assignment_repo.get_by_student_and_schedule(student_id, schedule_id)

        try:
            if assignment is None or assignment.status == AssignmentStatus.PENDING:
                # ---- First start (or a pre-assigned session never started) ----
                # The availability window gates who may begin; it never governs
                # the candidate's remaining time.
                if schedule.status not in (ExamScheduleStatus.ACTIVE, ExamScheduleStatus.SCHEDULED):
                    raise ExamUnavailableException("This exam is not currently active")
                if current_time < schedule.start_time:
                    raise ExamUnavailableException("The exam has not started yet")
                if current_time > schedule.end_time:
                    raise ExamUnavailableException("The exam availability window has closed")

                # PENDING assignment may carry a per-student time override
                # (individual_duration_minutes); otherwise the exam duration
                # applies. Fresh sessions (assignment is None) always use the
                # exam duration because no admin override exists yet.
                exam_duration = timedelta(
                    minutes=assignment.individual_duration_minutes
                    if assignment and assignment.individual_duration_minutes
                    else schedule.exam.duration_minutes
                )

                if assignment is None:
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
                else:
                    # PENDING assignment: first actual start, set timers once.
                    # Clear stale pause/submission fields that a previous
                    # (auto-submitted or manually reset) session may have left
                    # behind, so the fresh timer never inherits leftover state.
                    assignment.started_at = current_time
                    assignment.expires_at = current_time + exam_duration
                    assignment.last_activity_at = current_time
                    assignment.resume_count = 1
                    assignment.status = AssignmentStatus.IN_PROGRESS
                    assignment.paused_at = None
                    assignment.submitted_at = None
                    assignment.is_auto_submitted = False

            else:
                # ---- Existing assignment: resume or terminal state ----
                if assignment.status == AssignmentStatus.IN_PROGRESS:
                    # Resume from a pause: shift the deadline forward by the
                    # pause duration so paused time is not counted as active.
                    self._unpause(assignment, current_time)
                    if assignment.expires_at is not None and current_time >= assignment.expires_at:
                        self._mark_expired(assignment, current_time)
                        raise SessionExpiredException("Exam session has expired")
                    # Resume: never recompute expires_at, never create another assignment.
                    assignment.last_activity_at = current_time
                    assignment.resume_count += 1

                elif assignment.status in (
                    AssignmentStatus.SUBMITTED,
                    AssignmentStatus.AUTO_SUBMITTED,
                ):
                    raise SessionAlreadySubmittedException("Exam has already been submitted")

                elif assignment.status == AssignmentStatus.EXPIRED:
                    raise SessionExpiredException("Exam session has expired")

                elif assignment.status == AssignmentStatus.TERMINATED:
                    raise SessionExpiredException("Exam session has been terminated")

                else:
                    raise ExamUnavailableException(f"Cannot start session in state: {assignment.status}")

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
            session=self._build_session_response(assignment, schedule.exam.duration_minutes),
        )

    def pause_exam_session(
        self, student_id: uuid.UUID, schedule_id: uuid.UUID
    ) -> ExamSessionSnapshotResponse:
        """
        Pauses the candidate's individual timer (candidate leaves the exam).

        Called by the exam workbench when the page is hidden/closed and by the
        background sweeper for inactive sessions. While paused_at is set the
        individual timer is frozen: the expiry sweeps skip the session, lazy
        expiry checks treat it as not expired, and the deadline is shifted
        forward by the pause duration when the candidate resumes.

        Idempotent: pausing an already-paused or terminal session is a no-op
        that still returns the current session snapshot.
        """
        schedule = self.schedule_repo.get_by_id(schedule_id)
        if not schedule:
            raise ExamUnavailableException("Exam schedule not found")

        assignment = self._lock_assignment(student_id, schedule_id)
        if not assignment:
            raise ExamUnavailableException("Exam session has not been started")

        current_time = datetime.now(timezone.utc)

        if assignment.status == AssignmentStatus.IN_PROGRESS and assignment.paused_at is None:
            if assignment.expires_at is not None and current_time >= assignment.expires_at:
                # Time ran out before the candidate could be paused: mark expired.
                self._mark_expired(assignment, current_time)
            else:
                assignment.paused_at = current_time
                assignment.last_activity_at = current_time
                try:
                    self.db.commit()
                except Exception:
                    self.db.rollback()
                    raise

        session = self._build_session_response(assignment, schedule.exam.duration_minutes)
        return ExamSessionSnapshotResponse(
            server_current_time=datetime.now(timezone.utc),
            **session.model_dump(),
        )

    def pause_inactive_sessions(self, now: datetime | None = None) -> int:
        """
        Server-authoritative fallback for the pause signal: pauses sessions
        whose last activity predates the inactivity timeout (browser crash,
        network loss, power failure — cases where the client could not signal
        the pause itself). The pause is backdated to the candidate's last known
        activity so the inactive window is not counted as examination time.
        Returns the number of sessions paused.
        """
        current_time = now or datetime.now(timezone.utc)
        inactive = self.assignment_repo.get_in_progress_inactive(
            current_time, settings.exam_inactivity_timeout_seconds
        )

        for assignment in inactive:
            assignment.paused_at = assignment.last_activity_at or current_time

        if inactive:
            try:
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

        return len(inactive)

    def _mark_expired(self, assignment: StudentExam, current_time: datetime) -> None:
        """
        Marks a session EXPIRED once server time exceeds its individual timer,
        preventing any further modifications. Auto-submission is handled by the
        server-side sweep (auto_submit_expired_sessions).
        """
        assignment.status = AssignmentStatus.EXPIRED
        assignment.last_activity_at = current_time
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def auto_submit_expired_sessions(self, now: datetime | None = None) -> int:
        """
        Server-authoritative sweep that auto-submits sessions whose individual
        timer (expires_at) has elapsed. Uses server time only — frontend
        timestamps are never trusted. Paused sessions are excluded: their timer
        is frozen and the deadline is shifted forward on resume. Preserves
        existing grading logic by delegating result calculation to
        ResultCalculationService. Returns the number of sessions auto-submitted.
        """
        current_time = now or datetime.now(timezone.utc)
        expired = self.assignment_repo.get_in_progress_expired(current_time)

        for assignment in expired:
            assignment.status = AssignmentStatus.AUTO_SUBMITTED
            assignment.is_auto_submitted = True
            assignment.submitted_at = assignment.expires_at or current_time
            assignment.last_activity_at = current_time
            self.result_calc_service.calculate_for_session(assignment.id)

        if expired:
            try:
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

        return len(expired)

    def auto_submit_overdue_paused_sessions(self, now: datetime | None = None) -> int:
        """
        Safety net sweep: auto-submits paused sessions that can no longer be
        meaningfully resumed. A session qualifies when ALL of the following hold:

        - It has been paused for at least ``exam_max_pause_minutes`` (ensures
          very recently paused sessions are never prematurely swept).
        - AND at least one of:
            a. The exam schedule's availability window (end_time) has closed —
               the candidate can no longer re-enter regardless of remaining time.
            b. The candidate's individual frozen timer has elapsed — all exam
               duration has been consumed (expires_at <= paused_at).

        This policy deliberately does NOT auto-submit sessions whose exam window
        is still open and whose individual timer has time remaining, even if
        they have been paused for a long time. Those sessions can still be
        legitimately resumed by the candidate.

        Returns the number of sessions auto-submitted.
        """
        current_time = now or datetime.now(timezone.utc)
        overdue = self.assignment_repo.get_paused_overdue(
            current_time, settings.exam_max_pause_minutes
        )

        for assignment in overdue:
            assignment.status = AssignmentStatus.AUTO_SUBMITTED
            assignment.is_auto_submitted = True
            assignment.submitted_at = current_time
            assignment.last_activity_at = current_time
            self.result_calc_service.calculate_for_session(assignment.id)

        if overdue:
            try:
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

        return len(overdue)

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
            from sqlalchemy.orm import joinedload
            stmt = select(StudentExam).options(
                joinedload(StudentExam.exam_schedule).joinedload(ExamSchedule.exam)
            ).where(
                StudentExam.student_id == student_id,
                StudentExam.exam_schedule_id == schedule_id
            ).with_for_update(of=StudentExam)

            assignment = self.db.scalars(stmt).first()
            if not assignment:
                raise ExamUnavailableException("Exam session not found")

            if assignment.status in (AssignmentStatus.SUBMITTED, AssignmentStatus.AUTO_SUBMITTED):
                raise SessionAlreadySubmittedException("Exam is already submitted")

            if assignment.status == AssignmentStatus.EXPIRED:
                raise SessionExpiredException("Exam session has expired")

            if assignment.status == AssignmentStatus.TERMINATED:
                raise SessionExpiredException("Exam session has been terminated")

            if assignment.status != AssignmentStatus.IN_PROGRESS:
                raise ExamUnavailableException("Exam session is not in progress")

            current_time = datetime.now(timezone.utc)

            # A stale client auto-submit fired by an out-of-date local countdown
            # must not consume a paused session's remaining time. The candidate
            # resumes first (POST /start shifts the deadline) and the client
            # timer is only re-enabled after the pause is lifted.
            if assignment.paused_at is not None:
                if is_auto_submit:
                    raise SessionPausedException(
                        "Exam session is paused; resume the session before submitting"
                    )
                # Manual submit while paused is a deliberate candidate decision:
                # honor the pause by shifting the deadline before the expiry check.
                self._unpause(assignment, current_time)

            # --- Reject submission if the individual timer has expired ---
            if assignment.expires_at is not None and current_time >= assignment.expires_at:
                self._mark_expired(assignment, current_time)
                raise SessionExpiredException(
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

    def get_student_exam_result(
        self, student_id: uuid.UUID, schedule_id: uuid.UUID
    ) -> StudentResultInfo:
        """
        Retrieves the candidate's published result for an exam schedule.
        If result is not published yet, raises BusinessRuleException.
        """
        schedule = self.schedule_repo.get_by_id_with_details(schedule_id)
        if not schedule:
            raise ExamUnavailableException("Exam schedule not found")

        assignment = self.assignment_repo.get_by_student_and_schedule(student_id, schedule_id)
        if not assignment:
            raise ExamUnavailableException("No exam session found for this schedule")

        if not assignment.result and assignment.status in [AssignmentStatus.SUBMITTED, AssignmentStatus.AUTO_SUBMITTED, AssignmentStatus.EXPIRED]:
            self.result_calc_service.calculate_for_session(assignment.id)
            self.db.commit()
            self.db.refresh(assignment)

        if not assignment.result:
            raise ExamUnavailableException("No result record found for this exam schedule")

        if assignment.result.published_at is None:
            raise BusinessRuleException("Exam result has not been published by the administration yet")

        res = assignment.result
        return StudentResultInfo(
            is_published=True,
            published_at=res.published_at,
            obtained_marks=res.obtained_marks,
            total_marks=schedule.exam.total_marks if schedule.exam else None,
            percentage=res.percentage,
            grade=res.grade,
            evaluation_status=res.evaluation_status.value if hasattr(res.evaluation_status, "value") else str(res.evaluation_status),
        )

    def get_student_exam_review(
        self, student_id: uuid.UUID, schedule_id: uuid.UUID
    ) -> ExamReviewResponse:
        """
        Retrieves full question-by-question review data for a published exam.
        Includes candidate submitted answers, correct option indicators, awarded marks,
        and descriptive evaluator feedback.
        Raises BusinessRuleException if results are not published yet.
        """
        schedule = self.schedule_repo.get_by_id_with_details(schedule_id)
        if not schedule:
            raise ExamUnavailableException("Exam schedule not found")

        assignment = self.assignment_repo.get_by_student_and_schedule(student_id, schedule_id)
        if not assignment:
            raise ExamUnavailableException("No exam session found for this schedule")

        if not assignment.result and assignment.status in [AssignmentStatus.SUBMITTED, AssignmentStatus.AUTO_SUBMITTED, AssignmentStatus.EXPIRED]:
            self.result_calc_service.calculate_for_session(assignment.id)
            self.db.commit()
            self.db.refresh(assignment)

        if not assignment.result:
            raise ExamUnavailableException("No result record found for this exam schedule")

        if assignment.result.published_at is None:
            raise BusinessRuleException("Exam review is available only after results are published by the administration")

        res = assignment.result

        # Map student answers by question_id
        saved_answers_map = {ans.question_id: ans for ans in assignment.answers}

        question_items = []
        questions = sorted(schedule.exam.questions, key=lambda q: q.display_order) if schedule.exam and schedule.exam.questions else []

        for q in questions:
            user_ans = saved_answers_map.get(q.id)

            # Map options
            option_items = []
            if q.options:
                sorted_opts = sorted(q.options, key=lambda o: o.display_order)
                for opt in sorted_opts:
                    is_selected = user_ans is not None and user_ans.selected_option_id == opt.id
                    option_items.append(
                        OptionReviewItem(
                            id=opt.id,
                            option_text=opt.option_text,
                            is_correct=opt.is_correct,
                            is_selected=is_selected,
                        )
                    )

            obtained_marks = user_ans.awarded_marks if user_ans and user_ans.awarded_marks is not None else 0.0

            # Determine question status
            if not user_ans or (user_ans.selected_option_id is None and not user_ans.answer_text):
                q_status = "UNANSWERED"
            elif getattr(q.question_type, "value", str(q.question_type)) == "MCQ":
                selected_opt = next((o for o in q.options if user_ans and user_ans.selected_option_id == o.id), None)
                if selected_opt and selected_opt.is_correct:
                    q_status = "CORRECT"
                else:
                    q_status = "INCORRECT"
            else:
                # Descriptive
                if obtained_marks >= q.marks:
                    q_status = "CORRECT"
                elif obtained_marks > 0:
                    q_status = "PARTIAL"
                else:
                    q_status = "INCORRECT"

            question_items.append(
                QuestionReviewItem(
                    question_id=q.id,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    marks=q.marks,
                    negative_marks=q.negative_marks or 0.0,
                    obtained_marks=obtained_marks,
                    status=q_status,
                    saved_answer_option_id=user_ans.selected_option_id if user_ans else None,
                    saved_answer_text=user_ans.answer_text if user_ans else None,
                    evaluator_feedback=user_ans.evaluator_feedback if user_ans else None,
                    options=option_items,
                )
            )

        return ExamReviewResponse(
            schedule_id=schedule.id,
            subject_name=schedule.exam.subject.name if schedule.exam and schedule.exam.subject else "Examination",
            subject_code=schedule.exam.subject.subject_code if schedule.exam and schedule.exam.subject else "EXAM",
            department_name=schedule.exam.subject.department.name if schedule.exam and schedule.exam.subject and schedule.exam.subject.department else "Department",
            total_marks=schedule.exam.total_marks if schedule.exam else 0.0,
            obtained_marks=res.obtained_marks,
            percentage=res.percentage,
            grade=res.grade,
            published_at=res.published_at,
            questions=question_items,
        )
