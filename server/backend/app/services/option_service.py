from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.option import Option
from app.models.question import Question, QuestionType
from app.repositories.option_repository import OptionRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.option import OptionCreate, OptionUpdate, OptionResponse
from app.schemas.pagination import PaginatedData
from app.core.exceptions import NotFoundException, ConflictException, ValidationException, BusinessRuleException

class OptionService:
    def __init__(self, db: Session, option_repo: OptionRepository, question_repo: QuestionRepository):
        self.db = db
        self.option_repo = option_repo
        self.question_repo = question_repo

    def get_options(self, page: int, page_size: int, question_id: UUID | None = None) -> PaginatedData[OptionResponse]:
        skip = (page - 1) * page_size
        items = self.option_repo.get_all(skip, page_size, question_id)
        total = self.option_repo.get_count(question_id)
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def get_option(self, option_id: UUID) -> Option:
        option = self.option_repo.get_by_id(option_id)
        if not option:
            raise NotFoundException(resource_name="Option")
        return option

    def _validate_mcq_question(self, question_id: UUID) -> Question:
        question = self.question_repo.get_by_id(question_id)
        if not question:
            raise NotFoundException(resource_name="Question")
        if question.question_type != QuestionType.MCQ:
            raise BusinessRuleException("Option operations are not permitted for descriptive questions")
        return question

    def _ensure_single_correct_option(self, question_id: UUID, current_option_id: UUID | None = None) -> None:
        """
        Ensures that if an option is being marked as correct, any existing correct option is unset.
        """
        existing_correct = self.option_repo.get_correct_option_for_question(question_id)
        if existing_correct and (current_option_id is None or existing_correct.id != current_option_id):
            existing_correct.is_correct = False
            self.option_repo.update(existing_correct)

    def create_option(self, data: OptionCreate) -> Option:
        self._validate_mcq_question(data.question_id)
        
        if data.is_correct:
            self._ensure_single_correct_option(data.question_id)
            
        option = Option(
            option_text=data.option_text,
            display_order=data.display_order,
            is_correct=data.is_correct,
            question_id=data.question_id
        )
        
        try:
            self.option_repo.create(option)
            self.db.commit()
            self.db.refresh(option)
            return option
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_option(self, option_id: UUID, data: OptionUpdate) -> Option:
        option = self.get_option(option_id)
        target_question_id = data.question_id if data.question_id else option.question_id
        self._validate_mcq_question(target_question_id)
            
        # Handle logic for multiple correct options
        if data.is_correct is True:
            self._ensure_single_correct_option(target_question_id, current_option_id=option.id)

        if data.option_text is not None:
            option.option_text = data.option_text
        if data.display_order is not None:
            option.display_order = data.display_order
        if data.is_correct is not None:
            option.is_correct = data.is_correct
        if data.question_id is not None:
            option.question_id = data.question_id

        try:
            self.db.commit()
            self.db.refresh(option)
            return option
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def delete_option(self, option_id: UUID) -> None:
        option = self.get_option(option_id)
        self._validate_mcq_question(option.question_id)
        
        # Enforce Minimum Options rule during deletion
        total_options = self.option_repo.get_count(option.question_id)
        if total_options <= 2:
            raise ValidationException(detail="A question must have at least 2 options. Cannot delete.")
            
        try:
            self.option_repo.delete(option)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise

