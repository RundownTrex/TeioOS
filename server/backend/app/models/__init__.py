from app.models.user import User
from app.models.department import Department
from app.models.subject import Subject
from app.models.class_ import Class
from app.models.student import Student
from app.models.exam import Exam
from app.models.question import Question, QuestionType
from app.models.option import Option
from app.models.exam_schedule import ExamSchedule
from app.models.student_exam import StudentExam, AssignmentStatus
from app.models.student_answer import StudentAnswer
from app.models.result import Result, EvaluationStatus

# Ensure they are available for Alembic to auto-generate migrations
__all__ = [
    "User", "Department", "Subject", "Class", "Student",
    "Exam", "Question", "QuestionType", "Option",
    "ExamSchedule", "StudentExam", "AssignmentStatus",
    "StudentAnswer", "Result", "EvaluationStatus"
]

