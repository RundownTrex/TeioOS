from fastapi import APIRouter

from app.api.routes.root import router as root_router
from app.api.routes.health import router as health_router
from app.api.routes.admin.auth import router as admin_auth_router
from app.api.routes.admin.departments import router as admin_departments_router
from app.api.routes.admin.classes import router as admin_classes_router
from app.api.routes.admin.students import router as admin_students_router
from app.api.routes.admin.users import router as admin_users_router
from app.api.routes.admin.exams import router as admin_exams_router
from app.api.routes.admin.exam_schedules import router as admin_exam_schedules_router
from app.api.routes.admin.student_assignments import router as admin_student_assignments_router
from app.api.routes.admin.questions import router as admin_questions_router
from app.api.routes.admin.options import router as admin_options_router
from app.api.routes.admin.results import router as admin_results_router
from app.api.routes.admin.student_answers import router as admin_student_answers_router
from app.api.routes.admin.dashboard import router as admin_dashboard_router
from app.api.routes.admin.analytics import router as admin_analytics_router
from app.api.routes.admin.subjects import router as admin_subjects_router
from app.api.routes.student.auth import router as student_auth_router
from app.api.routes.student.exams import router as student_exams_router
from app.api.routes.student.answers import router as student_answers_router

apirouter = APIRouter(prefix="/api/v1")

apirouter.include_router(root_router)
apirouter.include_router(health_router)
apirouter.include_router(admin_auth_router, prefix="/admin/auth", tags=["Admin Auth"])
apirouter.include_router(admin_departments_router, prefix="/admin/departments", tags=["Admin Departments"])
apirouter.include_router(admin_subjects_router, prefix="/admin/subjects", tags=["Admin Subjects"])
apirouter.include_router(admin_classes_router, prefix="/admin/classes", tags=["Admin Classes"])
apirouter.include_router(admin_students_router, prefix="/admin/students", tags=["Admin Students"])
apirouter.include_router(admin_users_router, prefix="/admin/users", tags=["Admin Users"])
apirouter.include_router(admin_exams_router, prefix="/admin/exams", tags=["Admin Exams"])
apirouter.include_router(admin_exam_schedules_router, prefix="/admin/exam-schedules", tags=["Admin Exam Schedules"])
apirouter.include_router(admin_student_assignments_router, prefix="/admin/exam-schedules/{schedule_id}/students", tags=["Admin Student Assignments"])
apirouter.include_router(admin_questions_router, prefix="/admin/questions", tags=["Admin Questions"])
apirouter.include_router(admin_options_router, prefix="/admin/options", tags=["Admin Options"])
apirouter.include_router(admin_student_answers_router, prefix="/admin/student-answers", tags=["Admin Student Answers Evaluation"])
apirouter.include_router(admin_results_router, prefix="/admin/results", tags=["Admin Results"])
apirouter.include_router(admin_dashboard_router, prefix="/admin/dashboard", tags=["Admin Dashboard"])
apirouter.include_router(admin_analytics_router, prefix="/admin/analytics", tags=["Admin Analytics"])
apirouter.include_router(student_auth_router, prefix="/student/auth", tags=["Student Auth"])
apirouter.include_router(student_exams_router, prefix="/student/exams", tags=["Student Exams"])
apirouter.include_router(student_answers_router, prefix="/student/answers", tags=["Student Answers"])