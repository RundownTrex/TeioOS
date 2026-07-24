from typing import Sequence
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.question import QuestionType
from app.models.student_answer import StudentAnswer
from app.repositories.student_answer_repository import StudentAnswerRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.user_repository import UserRepository
from app.services.result_calculation_service import ResultCalculationService
from app.core.exceptions import NotFoundException, BusinessRuleException


class EvaluationService:
    def __init__(
        self,
        db: Session,
        answer_repo: StudentAnswerRepository,
        question_repo: QuestionRepository,
        user_repo: UserRepository,
        result_calc_service: ResultCalculationService,
    ):
        self.db = db
        self.answer_repo = answer_repo
        self.question_repo = question_repo
        self.user_repo = user_repo
        self.result_calc_service = result_calc_service

    def get_answers_for_session(self, session_id: uuid.UUID) -> Sequence[StudentAnswer]:
        """
        Returns all student answers (both MCQ and Descriptive) for an exam session.
        """
        return self.answer_repo.get_all_by_session(session_id)

    def evaluate_answer(
        self,
        answer_id: uuid.UUID,
        evaluator_id: uuid.UUID,
        awarded_marks: float,
        feedback: str | None = None,
    ) -> StudentAnswer:
        """
        Evaluates a student's descriptive answer by assigning awarded marks and feedback.
        Triggers result recalculation and updates evaluation status.
        """
        # Validate answer exists
        answer = self.answer_repo.get_by_id(answer_id)
        if not answer:
            raise NotFoundException(resource_name="StudentAnswer")

        # Validate evaluator exists
        evaluator = self.user_repo.get_by_id(evaluator_id)
        if not evaluator:
            raise NotFoundException(resource_name="User")

        # Validate question is descriptive
        question = self.question_repo.get_by_id(answer.question_id)
        if not question or question.question_type != QuestionType.DESCRIPTIVE:
            raise BusinessRuleException("Only descriptive questions can be evaluated manually")

        # Validate awarded_marks range
        if awarded_marks < 0 or awarded_marks > question.marks:
            raise BusinessRuleException(
                f"Awarded marks must be between 0 and {question.marks}"
            )

        # Update answer evaluation details
        answer.awarded_marks = awarded_marks
        answer.evaluator_feedback = feedback
        answer.evaluated_at = datetime.now(timezone.utc)
        answer.evaluated_by = evaluator_id

        # Recalculate exam session result
        self.result_calc_service.calculate_for_session(answer.exam_session_id)

        self.db.commit()
        self.db.refresh(answer)
        return answer

