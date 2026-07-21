from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.question import Question
from app.models.option import Option
from app.repositories.question_repository import QuestionRepository
from app.repositories.exam_repository import ExamRepository
from app.schemas.question import QuestionCreate, QuestionUpdate
from app.schemas.pagination import PaginatedData
from app.core.exceptions import NotFoundException

class QuestionService:
    def __init__(self, db: Session, question_repo: QuestionRepository, exam_repo: ExamRepository):
        self.db = db
        self.question_repo = question_repo
        self.exam_repo = exam_repo

    def get_questions(self, page: int, page_size: int, exam_id: UUID | None = None) -> PaginatedData[Question]:
        skip = (page - 1) * page_size
        items = self.question_repo.get_all(skip, page_size, exam_id)
        total = self.question_repo.get_count(exam_id)
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

    def create_question(self, data: QuestionCreate) -> Question:
        self._validate_exam(data.exam_id)
        
        question = Question(
            question_text=data.question_text,
            marks=data.marks,
            negative_marks=data.negative_marks,
            display_order=data.display_order,
            exam_id=data.exam_id
        )
        
        # Add options
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
        
        if data.exam_id and data.exam_id != question.exam_id:
            self._validate_exam(data.exam_id)
            
        if data.question_text is not None:
            question.question_text = data.question_text
        if data.marks is not None:
            question.marks = data.marks
        if data.negative_marks is not None:
            question.negative_marks = data.negative_marks
        if data.display_order is not None:
            question.display_order = data.display_order
        if data.exam_id is not None:
            question.exam_id = data.exam_id

        # Replace options if provided
        if data.options is not None:
            # Clear existing options (cascade delete will handle orphans via SQLAlchemy)
            question.options.clear()
            # Append new options
            for opt in data.options:
                question.options.append(Option(
                    option_text=opt.option_text,
                    display_order=opt.display_order,
                    is_correct=opt.is_correct
                ))

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
