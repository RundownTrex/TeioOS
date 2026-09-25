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
        Ensures placeholder answer records exist for unattempted questions so the evaluator
        can inspect all questions in the paper and skipped questions default to 0 marks.
        """
        from app.models.student_exam import StudentExam
        from app.models.exam_schedule import ExamSchedule
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload

        assignment = self.db.scalars(
            select(StudentExam)
            .options(joinedload(StudentExam.exam_schedule).joinedload(ExamSchedule.exam))
            .where(StudentExam.id == session_id)
        ).first()

        existing_answers = list(self.answer_repo.get_all_by_session(session_id))
        if not assignment or not assignment.exam_schedule or not assignment.exam_schedule.exam:
            return existing_answers

        exam_questions = self.question_repo.get_all(exam_id=assignment.exam_schedule.exam_id, limit=1000)
        existing_q_ids = {ans.question_id for ans in existing_answers}

        timestamp = assignment.submitted_at or assignment.last_activity_at or datetime.now(timezone.utc)
        created_any = False

        for q in exam_questions:
            if q.id not in existing_q_ids:
                new_ans = StudentAnswer(
                    id=uuid.uuid4(),
                    student_exam_id=session_id,
                    question_id=q.id,
                    answered_at=timestamp,
                    selected_option_id=None,
                    answer_text=None,
                    awarded_marks=0.0 if q.question_type == QuestionType.DESCRIPTIVE else None,
                    created_at=timestamp,
                    updated_at=timestamp,
                )
                new_ans.question = q
                self.db.add(new_ans)
                existing_answers.append(new_ans)
                created_any = True

        if created_any:
            self.db.commit()
            return self.answer_repo.get_all_by_session(session_id)

        return existing_answers

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

        # Recalculate exam assignment result
        self.result_calc_service.calculate_for_session(answer.student_exam_id)

        self.db.commit()
        self.db.refresh(answer)
        return answer

