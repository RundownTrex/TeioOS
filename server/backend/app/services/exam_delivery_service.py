import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session


from app.models.student_exam import StudentExam, AssignmentStatus
from app.models.question import QuestionType

from app.repositories.student_exam_repository import StudentExamRepository
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.student_answer_repository import StudentAnswerRepository
from app.services.student_answer_service import StudentAnswerService
from app.schemas.student_exam_delivery import ExamQuestionsPayload, QuestionDisplay, OptionDisplay
from app.core.exceptions import BusinessRuleException, AuthorizationException


class ExamDeliveryService:
    def __init__(
        self,
        db: Session,
        assignment_repo: StudentExamRepository,
        schedule_repo: ExamScheduleRepository,
        question_repo: QuestionRepository,
        answer_repo: StudentAnswerRepository,
        answer_service: StudentAnswerService | None = None,
    ):
        self.db = db
        self.assignment_repo = assignment_repo
        self.schedule_repo = schedule_repo
        self.question_repo = question_repo
        self.answer_repo = answer_repo
        self.answer_service = answer_service or StudentAnswerService(db, question_repo, answer_repo)

    def _validate_assignment_active(self, assignment_id: uuid.UUID, schedule_id: uuid.UUID):
        """
        Validates that the exam assignment (session) is active and has not expired.
        Auto-marks as EXPIRED if the individual timer has elapsed.
        """
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment or assignment.exam_schedule_id != schedule_id:
            raise AuthorizationException("Invalid session")

        if assignment.status != AssignmentStatus.IN_PROGRESS:
            raise BusinessRuleException("Exam session is not active")

        current_time = datetime.now(timezone.utc)

        # --- Check individual session timer expiry ---
        if assignment.expires_at and current_time > assignment.expires_at:
            assignment.status = AssignmentStatus.EXPIRED
            assignment.last_activity_at = current_time
            self.db.commit()
            raise BusinessRuleException("Exam time has expired")

        return assignment

    def get_questions_for_session(self, assignment_id: uuid.UUID, schedule_id: uuid.UUID) -> ExamQuestionsPayload:
        assignment = self._validate_assignment_active(assignment_id, schedule_id)

        # Update last activity timestamp
        assignment.last_activity_at = datetime.now(timezone.utc)
        self.db.commit()

        # 1. Fetch questions with options
        schedule = self.schedule_repo.get_by_id(schedule_id)
        questions = self.question_repo.get_all(exam_id=schedule.exam_id, limit=1000)

        # 2. Fetch previously saved answers
        saved_answers = self.answer_repo.get_all_by_session(assignment_id)
        saved_answers_option_map = {ans.question_id: ans.selected_option_id for ans in saved_answers}
        saved_answers_text_map = {ans.question_id: ans.answer_text for ans in saved_answers}

        # 3. Sanitize output
        display_questions = []
        for q in questions:
            if q.question_type == QuestionType.MCQ:
                options_display = [
                    OptionDisplay(
                        id=opt.id,
                        option_text=opt.option_text,
                        display_order=opt.display_order
                    ) for opt in q.options
                ]
                options_display.sort(key=lambda opt: opt.display_order)
            else:
                options_display = []

            display_questions.append(
                QuestionDisplay(
                    id=q.id,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    marks=q.marks,
                    negative_marks=q.negative_marks,
                    display_order=q.display_order,
                    max_characters=q.max_characters,
                    options=options_display,
                    saved_answer_option_id=saved_answers_option_map.get(q.id),
                    saved_answer_text=saved_answers_text_map.get(q.id)
                )
            )

        display_questions.sort(key=lambda q: q.display_order)

        return ExamQuestionsPayload(
            questions=display_questions,
            server_current_time=datetime.now(timezone.utc)
        )

    def save_answer(
        self,
        assignment_id: uuid.UUID,
        schedule_id: uuid.UUID,
        question_id: uuid.UUID,
        selected_option_id: uuid.UUID | None = None,
        answer_text: str | None = None,
    ) -> None:
        assignment = self._validate_assignment_active(assignment_id, schedule_id)

        # Update last activity timestamp
        assignment.last_activity_at = datetime.now(timezone.utc)

        # Validate question belongs to the exam
        schedule = self.schedule_repo.get_by_id(schedule_id)
        question = self.question_repo.get_by_id(question_id)
        if not question or question.exam_id != schedule.exam_id:
            raise BusinessRuleException("Invalid question for this exam")

        # Delegate answer validation and upsert to StudentAnswerService
        self.answer_service.save_student_answer(
            session_id=assignment_id,
            question_id=question_id,
            selected_option_id=selected_option_id,
            answer_text=answer_text,
        )
