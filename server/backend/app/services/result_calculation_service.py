import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.question import QuestionType
from app.models.result import Result, EvaluationStatus
from app.models.student_exam import StudentExam
from app.repositories.student_exam_repository import StudentExamRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.student_answer_repository import StudentAnswerRepository
from app.core.exceptions import BusinessRuleException


class ResultCalculationService:
    def __init__(
        self,
        db: Session,
        assignment_repo: StudentExamRepository,
        question_repo: QuestionRepository,
        answer_repo: StudentAnswerRepository,
    ):
        self.db = db
        self.assignment_repo = assignment_repo
        self.question_repo = question_repo
        self.answer_repo = answer_repo

    def calculate_for_session(self, assignment_id: uuid.UUID) -> Result:
        """
        Calculates the result for an exam assignment and adds/updates it in the DB session.
        Evaluates MCQ questions automatically and incorporates evaluated descriptive answers.
        Updates evaluation_status (COMPLETED, PENDING, or PARTIALLY_EVALUATED).
        Does NOT commit the transaction. The caller must commit.
        """
        assignment = self.assignment_repo.get_by_id_with_schedule(assignment_id)
        if not assignment:
            raise BusinessRuleException("Assignment not found")

        # Get questions for the exam
        questions = self.question_repo.get_all(exam_id=assignment.exam_schedule.exam_id, limit=1000)

        # Get student's answers
        student_answers = self.answer_repo.get_all_by_session(assignment_id)
        student_answers_map = {ans.question_id: ans for ans in student_answers}

        total_marks = assignment.exam_schedule.exam.total_marks
        obtained_marks = 0.0

        descriptive_questions_count = 0
        evaluated_descriptive_count = 0

        for q in questions:
            ans = student_answers_map.get(q.id)

            if q.question_type == QuestionType.MCQ:
                if ans and ans.selected_option_id:
                    correct_opt = next((o for o in q.options if o.is_correct), None)
                    if correct_opt and ans.selected_option_id == correct_opt.id:
                        obtained_marks += q.marks
                    else:
                        obtained_marks -= q.negative_marks
            elif q.question_type == QuestionType.DESCRIPTIVE:
                descriptive_questions_count += 1
                if ans and ans.awarded_marks is not None:
                    evaluated_descriptive_count += 1
                    obtained_marks += ans.awarded_marks

        if obtained_marks < 0:
            obtained_marks = 0.0

        percentage = (obtained_marks / total_marks * 100) if total_marks > 0 else 0.0

        if descriptive_questions_count == 0:
            evaluation_status = EvaluationStatus.COMPLETED
        elif evaluated_descriptive_count == 0:
            evaluation_status = EvaluationStatus.PENDING
        elif evaluated_descriptive_count == descriptive_questions_count:
            evaluation_status = EvaluationStatus.COMPLETED
        else:
            evaluation_status = EvaluationStatus.PARTIALLY_EVALUATED

        grade = None
        if percentage >= 90:
            grade = "A"
        elif percentage >= 80:
            grade = "B"
        elif percentage >= 70:
            grade = "C"
        elif percentage >= 60:
            grade = "D"
        else:
            grade = "F"

        existing_result = self.db.scalars(
            select(Result).where(Result.student_exam_id == assignment_id)
        ).first()

        if existing_result:
            existing_result.obtained_marks = obtained_marks
            existing_result.percentage = percentage
            existing_result.grade = grade
            existing_result.evaluation_status = evaluation_status
            return existing_result

        result = Result(
            student_exam_id=assignment_id,
            obtained_marks=obtained_marks,
            percentage=percentage,
            grade=grade,
            evaluation_status=evaluation_status,
            published_at=None
        )
        self.db.add(result)
        return result
