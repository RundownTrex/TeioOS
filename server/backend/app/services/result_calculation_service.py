import uuid
from sqlalchemy.orm import Session

from app.models.result import Result
from app.repositories.session_repository import SessionRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.student_answer_repository import StudentAnswerRepository
from app.core.exceptions import BusinessRuleException
from sqlalchemy import select


class ResultCalculationService:
    def __init__(
        self,
        db: Session,
        session_repo: SessionRepository,
        question_repo: QuestionRepository,
        answer_repo: StudentAnswerRepository,
    ):
        self.db = db
        self.session_repo = session_repo
        self.question_repo = question_repo
        self.answer_repo = answer_repo

    def calculate_for_session(self, session_id: uuid.UUID) -> Result:
        """
        Calculates the result for an exam session and adds it to the DB session.
        Does NOT commit the transaction. The caller must commit.
        """
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise BusinessRuleException("Session not found")

        # Get questions for the exam
        questions = self.question_repo.get_all(exam_id=session.exam_schedule.exam_id, limit=1000)
        
        # Build answer key
        # Map question_id -> (marks, negative_marks, correct_option_id)
        answer_key = {}
        total_marks = session.exam_schedule.exam.total_marks
        for q in questions:
            correct_opt = next((o for o in q.options if o.is_correct), None)
            if correct_opt:
                answer_key[q.id] = {
                    "marks": q.marks,
                    "negative_marks": q.negative_marks,
                    "correct_option_id": correct_opt.id
                }

        # Get student's answers
        student_answers = self.answer_repo.get_all_by_session(session_id)

        obtained_marks = 0.0
        for ans in student_answers:
            key = answer_key.get(ans.question_id)
            if not key:
                continue
            
            if ans.selected_option_id == key["correct_option_id"]:
                obtained_marks += key["marks"]
            else:
                obtained_marks -= key["negative_marks"]

        # Prevent negative total score if needed (assuming 0 is minimum)
        if obtained_marks < 0:
            obtained_marks = 0.0

        percentage = (obtained_marks / total_marks * 100) if total_marks > 0 else 0.0

        # Grade logic (basic example)
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

        # Check if a result already exists for this session (for idempotency)
        existing_result = self.db.scalars(
            select(Result).where(Result.exam_session_id == session_id)
        ).first()

        if existing_result:
            existing_result.obtained_marks = obtained_marks
            existing_result.percentage = percentage
            existing_result.grade = grade
            return existing_result

        result = Result(
            exam_session_id=session_id,
            obtained_marks=obtained_marks,
            percentage=percentage,
            grade=grade,
            published_at=None  # Not published by default
        )
        self.db.add(result)
        return result
