from typing import Annotated
from fastapi import Depends
from sqlalchemy.orm import Session

from app.api.dependencies.database import SessionDep
from app.repositories.user_repository import UserRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.exam_repository import ExamRepository
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.department_repository import DepartmentRepository
from app.repositories.class_repository import ClassRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.option_repository import OptionRepository
from app.repositories.student_exam_repository import StudentExamRepository
from app.repositories.result_repository import ResultRepository
from app.repositories.dashboard_repository import DashboardRepository


def get_user_repository(db: SessionDep) -> UserRepository:
    return UserRepository(db)


def get_student_repository(db: SessionDep) -> StudentRepository:
    return StudentRepository(db)


def get_exam_repository(db: SessionDep) -> ExamRepository:
    return ExamRepository(db)


def get_exam_schedule_repository(db: SessionDep) -> ExamScheduleRepository:
    return ExamScheduleRepository(db)


def get_session_repository(db: SessionDep) -> SessionRepository:
    return SessionRepository(db)


def get_department_repository(db: SessionDep) -> DepartmentRepository:
    return DepartmentRepository(db)


def get_class_repository(db: SessionDep) -> ClassRepository:
    return ClassRepository(db)


def get_question_repository(db: SessionDep) -> QuestionRepository:
    return QuestionRepository(db)


def get_option_repository(db: SessionDep) -> OptionRepository:
    return OptionRepository(db)


def get_student_exam_repository(db: SessionDep) -> StudentExamRepository:
    return StudentExamRepository(db)


def get_result_repository(db: SessionDep) -> ResultRepository:
    return ResultRepository(db)


def get_dashboard_repository(db: SessionDep) -> DashboardRepository:
    return DashboardRepository(db)


# Aliases for clean injection in other layers
UserRepoDep = Annotated[UserRepository, Depends(get_user_repository)]
StudentRepoDep = Annotated[StudentRepository, Depends(get_student_repository)]
ExamRepoDep = Annotated[ExamRepository, Depends(get_exam_repository)]
ExamScheduleRepoDep = Annotated[ExamScheduleRepository, Depends(get_exam_schedule_repository)]
SessionRepoDep = Annotated[SessionRepository, Depends(get_session_repository)]
DepartmentRepoDep = Annotated[DepartmentRepository, Depends(get_department_repository)]
ClassRepoDep = Annotated[ClassRepository, Depends(get_class_repository)]
QuestionRepoDep = Annotated[QuestionRepository, Depends(get_question_repository)]
OptionRepoDep = Annotated[OptionRepository, Depends(get_option_repository)]
StudentExamRepoDep = Annotated[StudentExamRepository, Depends(get_student_exam_repository)]
ResultRepoDep = Annotated[ResultRepository, Depends(get_result_repository)]
DashboardRepoDep = Annotated[DashboardRepository, Depends(get_dashboard_repository)]
