import uuid
from sqlalchemy.orm import Session
from app.models.question import QuestionType
from app.repositories.question_repository import QuestionRepository
from app.repositories.student_answer_repository import StudentAnswerRepository
from app.core.exceptions import NotFoundException, BusinessRuleException


class StudentAnswerService:
    def __init__(
        self,
        db: Session,
        question_repo: QuestionRepository,
        answer_repo: StudentAnswerRepository,
    ):
        self.db = db
        self.question_repo = question_repo
        self.answer_repo = answer_repo

    def save_student_answer(
        self,
        session_id: uuid.UUID,
        question_id: uuid.UUID,
        selected_option_id: uuid.UUID | None = None,
        answer_text: str | None = None,
    ) -> None:
        """
        Validates answer input according to QuestionType rules and upserts the answer into the database.
        """
        question = self.question_repo.get_by_id(question_id)
        if not question:
            raise NotFoundException(resource_name="Question")

        # Reject invalid combinations
        if selected_option_id is not None and answer_text is not None:
            raise BusinessRuleException("An answer cannot contain both a selected option and answer text")

        if question.question_type == QuestionType.MCQ:
            if selected_option_id is None:
                raise BusinessRuleException("MCQ questions require a selected option")
            if answer_text is not None:
                raise BusinessRuleException("MCQ questions cannot accept text answers")

            # Validate option belongs to the question
            valid_option = any(opt.id == selected_option_id for opt in question.options)
            if not valid_option:
                raise BusinessRuleException("Invalid option for this question")

        elif question.question_type == QuestionType.DESCRIPTIVE:
            if selected_option_id is not None:
                raise BusinessRuleException("Descriptive questions cannot accept selected options")
            if answer_text is None:
                raise BusinessRuleException("Descriptive questions require a text answer")

            if question.max_characters is not None and len(answer_text) > question.max_characters:
                raise BusinessRuleException(
                    f"Answer text exceeds maximum character limit of {question.max_characters}"
                )

        self.answer_repo.upsert_answer(
            session_id=session_id,
            question_id=question_id,
            option_id=selected_option_id,
            answer_text=answer_text,
        )
        self.db.commit()
