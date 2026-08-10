from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.question import Question, QuestionType
from app.models.option import Option
from app.repositories.question_repository import QuestionRepository
from app.repositories.exam_repository import ExamRepository
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse
from app.schemas.pagination import PaginatedData
from app.core.exceptions import NotFoundException, BusinessRuleException

class QuestionService:
    def __init__(self, db: Session, question_repo: QuestionRepository, exam_repo: ExamRepository):
        self.db = db
        self.question_repo = question_repo
        self.exam_repo = exam_repo

    def get_questions(
        self,
        page: int,
        page_size: int,
        exam_id: UUID | None = None,
        search: str | None = None,
        question_type: QuestionType | None = None,
    ) -> PaginatedData[QuestionResponse]:
        skip = (page - 1) * page_size
        search_query = search.strip() if search else None
        q_type = question_type.value if question_type else None
        items = self.question_repo.get_all(
            skip, page_size, exam_id=exam_id, search=search_query, question_type=q_type
        )
        total = self.question_repo.get_count(exam_id=exam_id, search=search_query, question_type=q_type)
        return PaginatedData(items=items, total=total, page=page, page_size=page_size)

    def get_question(self, question_id: UUID) -> Question:
        question = self.question_repo.get_by_id(question_id)
        if not question:
            raise NotFoundException(resource_name="Question")
        return question

    def _validate_exam(self, exam_id: UUID) -> None:
        exam = self.exam_repo.get_by_id(exam_id)
        if not exam:
            raise NotFoundException(resource_name="Exam")

    def _validate_question_type_and_options(
        self,
        question_type: QuestionType,
        options: list | None,
        max_characters: int | None,
    ) -> None:
        if question_type == QuestionType.MCQ:
            if not options or len(options) == 0:
                raise BusinessRuleException("MCQ questions must have options")
            if max_characters is not None:
                raise BusinessRuleException("MCQ questions cannot specify max_characters")
            
            correct_count = sum(1 for opt in options if getattr(opt, 'is_correct', False) is True)
            if correct_count != 1:
                raise BusinessRuleException("MCQ questions must have exactly one correct option")
        elif question_type == QuestionType.DESCRIPTIVE:
            if options and len(options) > 0:
                raise BusinessRuleException("Descriptive questions must not have options")
            if max_characters is not None and max_characters <= 0:
                raise BusinessRuleException("max_characters must be greater than 0")


    def create_question(self, data: QuestionCreate) -> Question:
        self._validate_exam(data.exam_id)
        question_type = data.question_type or QuestionType.MCQ
        self._validate_question_type_and_options(question_type, data.options, data.max_characters)

        if data.display_order is not None:
            display_order = data.display_order
        else:
            max_order = self.question_repo.get_max_display_order(data.exam_id)
            display_order = (max_order or 0) + 1

        question = Question(
            question_text=data.question_text,
            question_type=question_type,
            marks=data.marks,
            negative_marks=data.negative_marks,
            display_order=display_order,
            max_characters=data.max_characters if question_type == QuestionType.DESCRIPTIVE else None,
            exam_id=data.exam_id
        )
        
        # Add options for MCQ
        if question_type == QuestionType.MCQ and data.options:
            for opt in data.options:
                question.options.append(Option(
                    option_text=opt.option_text,
                    display_order=opt.display_order,
                    is_correct=opt.is_correct
                ))
            
        try:
            self.question_repo.create(question)
            self.db.commit()
            self.db.refresh(question)
            return question
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def update_question(self, question_id: UUID, data: QuestionUpdate) -> Question:
        question = self.get_question(question_id)
        
        target_type = data.question_type if data.question_type is not None else question.question_type
        target_options = data.options if data.options is not None else (question.options if target_type == QuestionType.MCQ else None)
        target_max_chars = data.max_characters if data.max_characters is not None else (question.max_characters if target_type == QuestionType.DESCRIPTIVE else None)

        self._validate_question_type_and_options(target_type, target_options, target_max_chars)

        if data.exam_id and data.exam_id != question.exam_id:
            self._validate_exam(data.exam_id)
            
        if data.question_text is not None:
            question.question_text = data.question_text
        if data.question_type is not None:
            question.question_type = data.question_type
        if data.marks is not None:
            question.marks = data.marks
        if data.negative_marks is not None:
            question.negative_marks = data.negative_marks
        if data.display_order is not None:
            question.display_order = data.display_order
        if data.max_characters is not None:
            question.max_characters = data.max_characters if target_type == QuestionType.DESCRIPTIVE else None
        elif target_type == QuestionType.MCQ:
            question.max_characters = None
        if data.exam_id is not None:
            question.exam_id = data.exam_id

        # Replace options if provided or clear if switching to descriptive
        if data.options is not None:
            question.options.clear()
            if target_type == QuestionType.MCQ:
                for opt in data.options:
                    question.options.append(Option(
                        option_text=opt.option_text,
                        display_order=opt.display_order,
                        is_correct=opt.is_correct
                    ))
        elif target_type == QuestionType.DESCRIPTIVE:
            question.options.clear()

        try:
            self.db.commit()
            self.db.refresh(question)
            return question
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def delete_question(self, question_id: UUID) -> None:
        question = self.get_question(question_id)
        try:
            self.question_repo.delete(question)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def reorder_questions(self, exam_id: UUID, ordered_ids: list[UUID]) -> int:
        """Assigns display_order 1..N following ordered_ids (a permutation)."""
        self._validate_exam(exam_id)

        if not ordered_ids:
            raise BusinessRuleException("ordered_ids must not be empty")
        if len(set(ordered_ids)) != len(ordered_ids):
            raise BusinessRuleException("ordered_ids must not contain duplicates")

        questions = self.question_repo.get_all(skip=0, limit=10_000, exam_id=exam_id)
        questions_by_id = {str(q.id): q for q in questions}

        if set(str(qid) for qid in ordered_ids) != set(questions_by_id.keys()):
            raise BusinessRuleException("ordered_ids must contain exactly the exam's questions")

        for index, question_id in enumerate(ordered_ids):
            questions_by_id[str(question_id)].display_order = index + 1

        try:
            self.db.commit()
            return len(ordered_ids)
        except SQLAlchemyError:
            self.db.rollback()
            raise

