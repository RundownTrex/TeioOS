import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.router import apirouter
from app.api.exception_handlers import add_exception_handlers
from app.db.session import SessionLocal
from app.repositories.student_exam_repository import StudentExamRepository
from app.repositories.exam_schedule_repository import ExamScheduleRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.student_answer_repository import StudentAnswerRepository
from app.services.exam_session_service import ExamSessionService
from app.services.result_calculation_service import ResultCalculationService

# Initialize logging before creating the app
setup_logging()

logger = logging.getLogger(__name__)


def _build_exam_session_service(db):
    """Constructs the session service for the background sweeper using a
    plain session, mirroring the DI wiring used by the API layer."""
    assignment_repo = StudentExamRepository(db)
    return ExamSessionService(
        db=db,
        assignment_repo=assignment_repo,
        schedule_repo=ExamScheduleRepository(db),
        result_calc_service=ResultCalculationService(
            db=db,
            assignment_repo=assignment_repo,
            question_repo=QuestionRepository(db),
            answer_repo=StudentAnswerRepository(db),
        ),
    )


async def _run_auto_submit_sweeper() -> None:
    """Periodically auto-submits expired exam sessions using server time only.

    Guarantees that candidates never lose or gain examination time because of
    client-side failures (browser close, network loss, power failure):
    1. pause_inactive_sessions freezes the timer of sessions whose candidate
       stopped being active (fallback when the pause signal was not delivered).
    2. auto_submit_expired_sessions auto-submits active sessions whose timer
       elapsed (paused sessions are exempt — their timer is frozen).
    3. auto_submit_overdue_paused_sessions auto-submits sessions that have been
       paused long enough AND whose schedule window has closed or whose
       individual timer has genuinely run out — never submits sessions mid-window.
    """
    while True:
        db = SessionLocal()
        try:
            service = _build_exam_session_service(db)
            paused_count = service.pause_inactive_sessions()
            expired_count = service.auto_submit_expired_sessions()
            overdue_count = service.auto_submit_overdue_paused_sessions()
            if paused_count:
                logger.info("Paused %d inactive exam session(s)", paused_count)
            if expired_count:
                logger.info("Auto-submitted %d expired exam session(s)", expired_count)
            if overdue_count:
                logger.info("Auto-submitted %d overdue paused exam session(s)", overdue_count)
        except Exception:
            logger.exception("Auto-submit sweeper iteration failed")
        finally:
            db.close()
        await asyncio.sleep(settings.auto_submit_sweep_interval_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    sweeper = asyncio.create_task(_run_auto_submit_sweeper())
    try:
        yield
    finally:
        sweeper.cancel()
        try:
            await sweeper
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# Register CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

# Register global exception handlers
add_exception_handlers(app)

app.include_router(apirouter)
