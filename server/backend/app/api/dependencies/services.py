from typing import Annotated
from fastapi import Depends

from app.api.dependencies.database import SessionDep
from app.api.dependencies.repositories import (
    UserRepoDep,
    StudentRepoDep,
    ExamRepoDep,
    ExamScheduleRepoDep,
    StudentExamRepoDep,
    DepartmentRepoDep,
    ClassRepoDep,
    QuestionRepoDep,
    OptionRepoDep,
    ResultRepoDep,
    DashboardRepoDep,
    SubjectRepoDep,
    StudentAnswerRepoDep,
    AnalyticsRepoDep,
)
from app.services.auth_service import AuthService
from app.services.student_auth_service import StudentAuthService
from app.services.user_service import UserService
from app.services.student_service import StudentService
from app.services.exam_service import ExamService
from app.services.exam_schedule_service import ExamScheduleService
from app.services.question_service import QuestionService
from app.services.option_service import OptionService
from app.services.student_exam_service import StudentExamService
from app.services.result_service import ResultService
from app.services.dashboard_service import DashboardService
from app.services.department_service import DepartmentService
from app.services.subject_service import SubjectService
from app.services.class_service import ClassService
from app.services.exam_session_service import ExamSessionService
from app.services.exam_delivery_service import ExamDeliveryService
from app.services.result_calculation_service import ResultCalculationService
from app.services.evaluation_service import EvaluationService
from app.services.analytics_service import AnalyticsService


def get_auth_service(db: SessionDep, user_repo: UserRepoDep) -> AuthService:
    return AuthService(db, user_repo)


def get_student_auth_service(
    db: SessionDep,
    student_repo: StudentRepoDep,
) -> StudentAuthService:
    return StudentAuthService(db, student_repo)


def get_user_service(db: SessionDep, user_repo: UserRepoDep) -> UserService:
    return UserService(db, user_repo)


def get_student_service(db: SessionDep, student_repo: StudentRepoDep, class_repo: ClassRepoDep) -> StudentService:
    return StudentService(db, student_repo, class_repo)


def get_exam_service(
    db: SessionDep,
    exam_repo: ExamRepoDep,
    user_repo: UserRepoDep,
    subject_repo: SubjectRepoDep,
    schedule_repo: ExamScheduleRepoDep,
) -> ExamService:
    return ExamService(db, exam_repo, user_repo, subject_repo, schedule_repo)


def get_exam_schedule_service(db: SessionDep, schedule_repo: ExamScheduleRepoDep, exam_repo: ExamRepoDep) -> ExamScheduleService:
    return ExamScheduleService(db, schedule_repo, exam_repo)


def get_question_service(db: SessionDep, question_repo: QuestionRepoDep, exam_repo: ExamRepoDep) -> QuestionService:
    return QuestionService(db, question_repo, exam_repo)


def get_option_service(db: SessionDep, option_repo: OptionRepoDep, question_repo: QuestionRepoDep) -> OptionService:
    return OptionService(db, option_repo, question_repo)


def get_department_service(db: SessionDep, department_repo: DepartmentRepoDep) -> DepartmentService:
    return DepartmentService(db, department_repo)


def get_subject_service(db: SessionDep, subject_repo: SubjectRepoDep, department_repo: DepartmentRepoDep) -> SubjectService:
    return SubjectService(db, subject_repo, department_repo)


def get_class_service(db: SessionDep, class_repo: ClassRepoDep, department_repo: DepartmentRepoDep) -> ClassService:
    return ClassService(db, class_repo, department_repo)


def get_student_exam_service(
    db: SessionDep, 
    student_exam_repo: StudentExamRepoDep, 
    student_repo: StudentRepoDep,
    schedule_repo: ExamScheduleRepoDep,
    class_repo: ClassRepoDep,
) -> StudentExamService:
    return StudentExamService(db, student_exam_repo, student_repo, schedule_repo, class_repo)


def get_result_service(result_repo: ResultRepoDep) -> ResultService:
    return ResultService(result_repo)


def get_dashboard_service(dashboard_repo: DashboardRepoDep) -> DashboardService:
    return DashboardService(dashboard_repo)


def get_result_calculation_service(
    db: SessionDep,
    student_exam_repo: StudentExamRepoDep,
    question_repo: QuestionRepoDep,
    answer_repo: StudentAnswerRepoDep,
) -> ResultCalculationService:
    return ResultCalculationService(db, student_exam_repo, question_repo, answer_repo)


def get_exam_session_service(
    db: SessionDep,
    student_exam_repo: StudentExamRepoDep,
    schedule_repo: ExamScheduleRepoDep,
    result_calc_service: Annotated[ResultCalculationService, Depends(get_result_calculation_service)],
) -> ExamSessionService:
    return ExamSessionService(db, student_exam_repo, schedule_repo, result_calc_service)


def get_exam_delivery_service(
    db: SessionDep,
    student_exam_repo: StudentExamRepoDep,
    schedule_repo: ExamScheduleRepoDep,
    question_repo: QuestionRepoDep,
    answer_repo: StudentAnswerRepoDep,
) -> ExamDeliveryService:
    return ExamDeliveryService(db, student_exam_repo, schedule_repo, question_repo, answer_repo)


def get_analytics_service(analytics_repo: AnalyticsRepoDep) -> AnalyticsService:
    return AnalyticsService(analytics_repo)


def get_evaluation_service(
    db: SessionDep,
    answer_repo: StudentAnswerRepoDep,
    question_repo: QuestionRepoDep,
    user_repo: UserRepoDep,
    result_calc_service: Annotated[ResultCalculationService, Depends(get_result_calculation_service)],
) -> EvaluationService:
    return EvaluationService(db, answer_repo, question_repo, user_repo, result_calc_service)


# Aliases for clean injection in routes
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
StudentAuthServiceDep = Annotated[StudentAuthService, Depends(get_student_auth_service)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
StudentServiceDep = Annotated[StudentService, Depends(get_student_service)]
ExamServiceDep = Annotated[ExamService, Depends(get_exam_service)]
ExamScheduleServiceDep = Annotated[ExamScheduleService, Depends(get_exam_schedule_service)]
QuestionServiceDep = Annotated[QuestionService, Depends(get_question_service)]
OptionServiceDep = Annotated[OptionService, Depends(get_option_service)]
DepartmentServiceDep = Annotated[DepartmentService, Depends(get_department_service)]
SubjectServiceDep = Annotated[SubjectService, Depends(get_subject_service)]
ClassServiceDep = Annotated[ClassService, Depends(get_class_service)]
StudentExamServiceDep = Annotated[StudentExamService, Depends(get_student_exam_service)]
ResultServiceDep = Annotated[ResultService, Depends(get_result_service)]
DashboardServiceDep = Annotated[DashboardService, Depends(get_dashboard_service)]
ExamSessionServiceDep = Annotated[ExamSessionService, Depends(get_exam_session_service)]
ExamDeliveryServiceDep = Annotated[ExamDeliveryService, Depends(get_exam_delivery_service)]
EvaluationServiceDep = Annotated[EvaluationService, Depends(get_evaluation_service)]
AnalyticsServiceDep = Annotated[AnalyticsService, Depends(get_analytics_service)]

