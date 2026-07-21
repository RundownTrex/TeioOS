import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session


from app.models.exam_session import SessionStatus

from app.repositories.session_repository import SessionRepository
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.student_answer_repository import StudentAnswerRepository
from app.schemas.student_exam_delivery import ExamQuestionsPayload, QuestionDisplay, OptionDisplay
from app.core.exceptions import BusinessRuleException, AuthorizationException


class ExamDeliveryService:
    def __init__(
        self,
        db: Session,
        session_repo: SessionRepository,
        schedule_repo: ExamScheduleRepository,
        question_repo: QuestionRepository,
        answer_repo: StudentAnswerRepository,
    ):
        self.db = db
        self.session_repo = session_repo
        self.schedule_repo = schedule_repo
        self.question_repo = question_repo
        self.answer_repo = answer_repo

    def _validate_session_active(self, session_id: uuid.UUID, schedule_id: uuid.UUID):
        session = self.session_repo.get_by_id(session_id)
        if not session or session.exam_schedule_id != schedule_id:
            raise AuthorizationException("Invalid session")

        if session.status != SessionStatus.IN_PROGRESS:
            raise BusinessRuleException("Exam session is not active")

        schedule = self.schedule_repo.get_by_id(schedule_id)
        current_time = datetime.now(timezone.utc)
        
        # Buffer of 10 seconds for network latency on answers
        if current_time > schedule.end_time:
            raise BusinessRuleException("Exam time has expired")

        return session, schedule

    def get_questions_for_session(self, session_id: uuid.UUID, schedule_id: uuid.UUID) -> ExamQuestionsPayload:
        session, schedule = self._validate_session_active(session_id, schedule_id)
        
        # 1. Fetch questions with options
        # We need all questions for the exam_id
        questions = self.question_repo.get_all(exam_id=schedule.exam_id, limit=1000)

        # 2. Fetch previously saved answers
        saved_answers = self.answer_repo.get_all_by_session(session_id)
        saved_answers_map = {ans.question_id: ans.selected_option_id for ans in saved_answers}

        # 3. Sanitize output (stripping correct options, metadata)
        display_questions = []
        for q in questions:
            options_display = [
                OptionDisplay(
                    id=opt.id,
                    option_text=opt.option_text,
                    display_order=opt.display_order
                ) for opt in q.options
            ]
            
            # SORTING: Options currently follow display_order. 
            # In the future, this can be replaced with a seeded randomizer using session_id.
            options_display.sort(key=lambda opt: opt.display_order)

            display_questions.append(
                QuestionDisplay(
                    id=q.id,
                    question_text=q.question_text,
                    marks=q.marks,
                    negative_marks=q.negative_marks,
                    display_order=q.display_order,
                    options=options_display,
                    saved_answer_option_id=saved_answers_map.get(q.id)
                )
            )

        # SORTING: Questions currently follow display_order.
        # In the future, this can be replaced with a seeded randomizer using session_id.
        display_questions.sort(key=lambda q: q.display_order)

        return ExamQuestionsPayload(
            questions=display_questions,
            server_current_time=datetime.now(timezone.utc)
        )

    def save_answer(self, session_id: uuid.UUID, schedule_id: uuid.UUID, question_id: uuid.UUID, option_id: uuid.UUID) -> None:
        session, schedule = self._validate_session_active(session_id, schedule_id)

        # Validate question belongs to the exam
        question = self.question_repo.get_by_id(question_id)
        if not question or question.exam_id != schedule.exam_id:
            raise BusinessRuleException("Invalid question for this exam")

        # Validate option belongs to the question
        valid_option = any(opt.id == option_id for opt in question.options)
        if not valid_option:
            raise BusinessRuleException("Invalid option for this question")

        # True PostgreSQL UPSERT
        self.answer_repo.upsert_answer(session_id, question_id, option_id)

        self.db.commit()
