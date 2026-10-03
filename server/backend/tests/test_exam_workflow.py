import uuid
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

from app.models.question import Question, QuestionType
from app.models.option import Option
from app.models.student_answer import StudentAnswer
from app.models.student_exam import StudentExam, AssignmentStatus
from app.models.exam_schedule import ExamSchedule
from app.models.exam import Exam
from app.models.result import Result, EvaluationStatus
from app.schemas.user import StudentSessionInfo
from app.services.student_answer_service import StudentAnswerService
from app.services.student_service import StudentService
from app.services.result_calculation_service import ResultCalculationService
from app.services.evaluation_service import EvaluationService
from app.schemas.student import StudentCreate, StudentUpdate
from datetime import date
from app.core.exceptions import BusinessRuleException, NotFoundException


class TestStudentSessionInfoSchema(unittest.TestCase):
    def test_accessibility_profile_included(self):
        info = StudentSessionInfo(
            user_id=str(uuid.uuid4()),
            roll_number="CS2026001",
            name="John Doe",
            department_name="Computer Science",
            class_name="CS-A",
            role="student",
            accessibility_profile="high_contrast",
        )
        self.assertEqual(info.accessibility_profile, "high_contrast")
        self.assertEqual(info.roll_number, "CS2026001")

    def test_default_accessibility_profile(self):
        info = StudentSessionInfo(
            user_id=str(uuid.uuid4()),
            roll_number="CS2026002",
            name="Jane Doe",
            department_name="Computer Science",
            class_name="CS-A",
            role="student",
        )
        self.assertEqual(info.accessibility_profile, "standard")


class TestStudentAccessibilityProfileService(unittest.TestCase):
    def setUp(self):
        self.db = MagicMock()
        self.student_repo = MagicMock()
        self.class_repo = MagicMock()
        self.service = StudentService(
            db=self.db,
            student_repo=self.student_repo,
            class_repo=self.class_repo,
        )

    def test_create_student_persists_accessibility_profile(self):
        self.class_repo.get_by_id.return_value = MagicMock()
        self.student_repo.get_by_roll_number.return_value = None

        data = StudentCreate(
            roll_number="CS2026100",
            name="Alice Smith",
            date_of_birth=date(2002, 5, 14),
            class_id=uuid.uuid4(),
            accessibility_profile="screen_reader",
        )

        student = self.service.create_student(data)
        self.assertEqual(student.accessibility_profile, "screen_reader")
        self.student_repo.create.assert_called_once()
        self.db.commit.assert_called_once()

    def test_update_student_accessibility_profile(self):
        student_id = uuid.uuid4()
        existing_student = MagicMock(
            id=student_id,
            roll_number="CS2026100",
            class_id=uuid.uuid4(),
            accessibility_profile="standard",
        )
        self.student_repo.get_by_id.return_value = existing_student

        update_data = StudentUpdate(accessibility_profile="high_contrast")
        self.service.update_student(student_id, update_data)

        self.assertEqual(existing_student.accessibility_profile, "high_contrast")
        self.db.commit.assert_called_once()


class TestStudentAnswerService(unittest.TestCase):
    def setUp(self):
        self.db = MagicMock()
        self.question_repo = MagicMock()
        self.answer_repo = MagicMock()
        self.service = StudentAnswerService(
            db=self.db,
            question_repo=self.question_repo,
            answer_repo=self.answer_repo,
        )

    def test_clear_answer_deletes_record(self):
        session_id = uuid.uuid4()
        question_id = uuid.uuid4()
        self.answer_repo.delete_answer.return_value = True

        # Candidate clears answer: both selected_option_id and answer_text are None
        self.service.save_student_answer(
            session_id=session_id,
            question_id=question_id,
            selected_option_id=None,
            answer_text=None,
        )

        self.answer_repo.delete_answer.assert_called_once_with(
            session_id=session_id,
            question_id=question_id,
        )
        self.db.commit.assert_called_once()
        self.answer_repo.upsert_answer.assert_not_called()

    def test_clear_answer_with_empty_text_deletes_record(self):
        session_id = uuid.uuid4()
        question_id = uuid.uuid4()
        self.answer_repo.delete_answer.return_value = True

        self.service.save_student_answer(
            session_id=session_id,
            question_id=question_id,
            selected_option_id=None,
            answer_text="   ",
        )

        self.answer_repo.delete_answer.assert_called_once_with(
            session_id=session_id,
            question_id=question_id,
        )
        self.db.commit.assert_called_once()

    def test_reject_both_option_and_text(self):
        session_id = uuid.uuid4()
        question_id = uuid.uuid4()
        mock_question = MagicMock()
        self.question_repo.get_by_id.return_value = mock_question

        with self.assertRaises(BusinessRuleException):
            self.service.save_student_answer(
                session_id=session_id,
                question_id=question_id,
                selected_option_id=uuid.uuid4(),
                answer_text="Some text",
            )

    def test_mcq_valid_option_saved(self):
        session_id = uuid.uuid4()
        question_id = uuid.uuid4()
        opt_id = uuid.uuid4()

        mock_option = MagicMock(id=opt_id)
        mock_question = MagicMock(
            question_type=QuestionType.MCQ,
            options=[mock_option],
        )
        self.question_repo.get_by_id.return_value = mock_question

        self.service.save_student_answer(
            session_id=session_id,
            question_id=question_id,
            selected_option_id=opt_id,
            answer_text=None,
        )

        self.answer_repo.upsert_answer.assert_called_once_with(
            session_id=session_id,
            question_id=question_id,
            option_id=opt_id,
            answer_text=None,
        )
        self.db.commit.assert_called_once()


class TestResultCalculationService(unittest.TestCase):
    def setUp(self):
        self.db = MagicMock()
        self.assignment_repo = MagicMock()
        self.question_repo = MagicMock()
        self.answer_repo = MagicMock()
        self.service = ResultCalculationService(
            db=self.db,
            assignment_repo=self.assignment_repo,
            question_repo=self.question_repo,
            answer_repo=self.answer_repo,
        )

    def test_mcq_scoring_and_auto_completion(self):
        session_id = uuid.uuid4()
        exam_id = uuid.uuid4()

        # Mock Exam and Assignment
        mock_exam = MagicMock(spec=Exam, total_marks=10.0)
        mock_schedule = MagicMock(spec=ExamSchedule, exam_id=exam_id, exam=mock_exam)
        mock_assignment = MagicMock(spec=StudentExam, exam_schedule=mock_schedule)
        self.assignment_repo.get_by_id_with_schedule.return_value = mock_assignment

        # Mock 2 MCQ questions
        q1_id = uuid.uuid4()
        opt1_correct = MagicMock(id=uuid.uuid4(), is_correct=True)
        opt1_wrong = MagicMock(id=uuid.uuid4(), is_correct=False)
        q1 = MagicMock(
            id=q1_id,
            question_type=QuestionType.MCQ,
            marks=5.0,
            negative_marks=1.0,
            options=[opt1_correct, opt1_wrong],
        )

        q2_id = uuid.uuid4()
        opt2_correct = MagicMock(id=uuid.uuid4(), is_correct=True)
        opt2_wrong = MagicMock(id=uuid.uuid4(), is_correct=False)
        q2 = MagicMock(
            id=q2_id,
            question_type=QuestionType.MCQ,
            marks=5.0,
            negative_marks=1.0,
            options=[opt2_correct, opt2_wrong],
        )

        self.question_repo.get_all.return_value = [q1, q2]

        # Student answered Q1 correctly and Q2 incorrectly
        ans1 = MagicMock(question_id=q1_id, selected_option_id=opt1_correct.id, answer_text=None)
        ans2 = MagicMock(question_id=q2_id, selected_option_id=opt2_wrong.id, answer_text=None)
        self.answer_repo.get_all_by_session.return_value = [ans1, ans2]

        self.db.scalars.return_value.first.return_value = None

        result = self.service.calculate_for_session(session_id)

        # Q1: +5, Q2: -1 => obtained = 4.0 out of 10.0 => 40%
        self.assertEqual(result.obtained_marks, 4.0)
        self.assertEqual(result.mcq_score, 4.0)
        self.assertEqual(result.percentage, 40.0)
        self.assertEqual(result.evaluation_status, EvaluationStatus.COMPLETED)

    def test_skipped_descriptive_defaults_to_zero_and_does_not_deadlock(self):
        session_id = uuid.uuid4()
        exam_id = uuid.uuid4()

        mock_exam = MagicMock(spec=Exam, total_marks=20.0)
        mock_schedule = MagicMock(spec=ExamSchedule, exam_id=exam_id, exam=mock_exam)
        mock_assignment = MagicMock(spec=StudentExam, exam_schedule=mock_schedule)
        self.assignment_repo.get_by_id_with_schedule.return_value = mock_assignment

        # Question 1: Descriptive, attempted by candidate
        q1_id = uuid.uuid4()
        q1 = MagicMock(id=q1_id, question_type=QuestionType.DESCRIPTIVE, marks=10.0)

        # Question 2: Descriptive, SKIPPED by candidate
        q2_id = uuid.uuid4()
        q2 = MagicMock(id=q2_id, question_type=QuestionType.DESCRIPTIVE, marks=10.0)

        self.question_repo.get_all.return_value = [q1, q2]

        # Candidate only submitted an answer for Q1
        ans1 = MagicMock(
            question_id=q1_id,
            answer_text="Comprehensive architectural essay response.",
            awarded_marks=8.5,
        )
        self.answer_repo.get_all_by_session.return_value = [ans1]
        self.db.scalars.return_value.first.return_value = None

        result = self.service.calculate_for_session(session_id)

        # Q1 was evaluated (8.5), Q2 was skipped (0.0)
        # Total = 8.5 / 20.0 = 42.5%
        # All attempted questions (Q1) have been evaluated -> status must be COMPLETED!
        self.assertEqual(result.obtained_marks, 8.5)
        self.assertEqual(result.descriptive_score, 8.5)
        self.assertEqual(result.evaluation_status, EvaluationStatus.COMPLETED)

    def test_all_descriptive_skipped_completes_automatically(self):
        session_id = uuid.uuid4()
        exam_id = uuid.uuid4()

        mock_exam = MagicMock(spec=Exam, total_marks=10.0)
        mock_schedule = MagicMock(spec=ExamSchedule, exam_id=exam_id, exam=mock_exam)
        mock_assignment = MagicMock(spec=StudentExam, exam_schedule=mock_schedule)
        self.assignment_repo.get_by_id_with_schedule.return_value = mock_assignment

        q_desc_id = uuid.uuid4()
        q_desc = MagicMock(id=q_desc_id, question_type=QuestionType.DESCRIPTIVE, marks=10.0)
        self.question_repo.get_all.return_value = [q_desc]

        # Candidate submitted zero answers
        self.answer_repo.get_all_by_session.return_value = []
        self.db.scalars.return_value.first.return_value = None

        result = self.service.calculate_for_session(session_id)

        self.assertEqual(result.obtained_marks, 0.0)
        self.assertEqual(result.descriptive_score, 0.0)
        # 0 attempted questions means no pending evaluation -> COMPLETED immediately
        self.assertEqual(result.evaluation_status, EvaluationStatus.COMPLETED)


class TestSpeechTranscriptionRoute(unittest.TestCase):
    """The route must stay thin: size-check the upload and delegate to the service."""

    def _payload(self):
        from app.schemas.token import TokenPayload

        return TokenPayload(
            sub=str(uuid.uuid4()),
            role="student",
            exam_session_id=str(uuid.uuid4()),
            exam_schedule_id=str(uuid.uuid4()),
        )

    def _file(self, content: bytes):
        mock_file = MagicMock()
        mock_file.filename = "dictation.wav"

        async def fake_read(size=-1):
            return content if size is None or size < 0 else content[:size]

        mock_file.read = fake_read
        return mock_file

    @patch("app.api.routes.student.speech.logger")
    def test_delegates_to_speech_service(self, _mock_logger):
        import asyncio
        from app.api.routes.student.speech import transcribe_student_audio
        from app.schemas.speech import SpeechTranscriptionResponse

        service = MagicMock()
        service.transcribe.return_value = SpeechTranscriptionResponse(
            text="the mitochondria", language="en-US", confidence=0.9
        )

        response = asyncio.run(transcribe_student_audio(
            token_payload=self._payload(),
            speech_service=service,
            file=self._file(b"RIFF-audio"),
            language="en-US",
        ))

        service.transcribe.assert_called_once_with(b"RIFF-audio", "en-US")
        self.assertTrue(response.success)
        self.assertEqual(response.data.text, "the mitochondria")

    @patch("app.api.routes.student.speech.logger")
    def test_rejects_oversized_upload(self, _mock_logger):
        import asyncio
        from app.api.routes.student import speech
        from app.core.exceptions import ValidationException

        service = MagicMock()
        oversized = b"\x00" * (speech.MAX_AUDIO_UPLOAD_BYTES + 1)

        with self.assertRaises(ValidationException):
            asyncio.run(speech.transcribe_student_audio(
                token_payload=self._payload(),
                speech_service=service,
                file=self._file(oversized),
                language="en-US",
            ))
        service.transcribe.assert_not_called()


class TestLazyPauseIfStale(unittest.TestCase):
    """Tests for _lazy_pause_if_stale — the retroactive pause that catches
    sessions whose client could not send a pause signal (VM force-shutdown,
    kernel panic, hard power loss)."""

    def _make_service(self):
        db = MagicMock()
        assignment_repo = MagicMock()
        schedule_repo = MagicMock()
        result_calc_service = MagicMock()

        from app.services.exam_session_service import ExamSessionService
        service = ExamSessionService(
            db=db,
            assignment_repo=assignment_repo,
            schedule_repo=schedule_repo,
            result_calc_service=result_calc_service,
        )
        return service

    def _make_assignment(self, *, status, paused_at=None, last_activity_at=None):
        assignment = MagicMock(spec=StudentExam)
        assignment.status = status
        assignment.paused_at = paused_at
        assignment.last_activity_at = last_activity_at
        assignment.expires_at = datetime(2026, 10, 2, 15, 0, 0, tzinfo=timezone.utc)
        return assignment

    @patch("app.services.exam_session_service.settings")
    def test_stale_session_gets_retroactively_paused(self, mock_settings):
        """A session idle longer than the inactivity timeout should have
        paused_at backdated to last_activity_at."""
        mock_settings.exam_inactivity_timeout_seconds = 60

        service = self._make_service()
        last_heartbeat = datetime(2026, 10, 2, 12, 0, 0, tzinfo=timezone.utc)
        now = datetime(2026, 10, 2, 12, 5, 0, tzinfo=timezone.utc)  # 5 min later

        assignment = self._make_assignment(
            status=AssignmentStatus.IN_PROGRESS,
            last_activity_at=last_heartbeat,
        )

        result = service._lazy_pause_if_stale(assignment, now)

        self.assertTrue(result)
        self.assertEqual(assignment.paused_at, last_heartbeat)

    @patch("app.services.exam_session_service.settings")
    def test_active_session_not_paused(self, mock_settings):
        """A session whose last heartbeat is within the timeout window should
        NOT be paused (normal active polling)."""
        mock_settings.exam_inactivity_timeout_seconds = 60

        service = self._make_service()
        last_heartbeat = datetime(2026, 10, 2, 12, 0, 0, tzinfo=timezone.utc)
        now = datetime(2026, 10, 2, 12, 0, 30, tzinfo=timezone.utc)  # 30s later

        assignment = self._make_assignment(
            status=AssignmentStatus.IN_PROGRESS,
            last_activity_at=last_heartbeat,
        )

        result = service._lazy_pause_if_stale(assignment, now)

        self.assertFalse(result)
        self.assertIsNone(assignment.paused_at)

    @patch("app.services.exam_session_service.settings")
    def test_already_paused_session_skipped(self, mock_settings):
        """A session that already has paused_at set (normal pause flow)
        should be skipped — no double-pause."""
        mock_settings.exam_inactivity_timeout_seconds = 60

        service = self._make_service()
        paused_time = datetime(2026, 10, 2, 12, 0, 0, tzinfo=timezone.utc)
        now = datetime(2026, 10, 2, 12, 5, 0, tzinfo=timezone.utc)

        assignment = self._make_assignment(
            status=AssignmentStatus.IN_PROGRESS,
            paused_at=paused_time,
            last_activity_at=paused_time,
        )

        result = service._lazy_pause_if_stale(assignment, now)

        self.assertFalse(result)
        # paused_at should remain at the original value
        self.assertEqual(assignment.paused_at, paused_time)

    @patch("app.services.exam_session_service.settings")
    def test_submitted_session_skipped(self, mock_settings):
        """Terminal states (SUBMITTED, etc.) should never trigger a pause."""
        mock_settings.exam_inactivity_timeout_seconds = 60

        service = self._make_service()
        last_heartbeat = datetime(2026, 10, 2, 12, 0, 0, tzinfo=timezone.utc)
        now = datetime(2026, 10, 2, 12, 5, 0, tzinfo=timezone.utc)

        assignment = self._make_assignment(
            status=AssignmentStatus.SUBMITTED,
            last_activity_at=last_heartbeat,
        )

        result = service._lazy_pause_if_stale(assignment, now)

        self.assertFalse(result)

    @patch("app.services.exam_session_service.settings")
    def test_no_activity_record_skipped(self, mock_settings):
        """If last_activity_at is None (should not happen normally), the
        method should return False without crashing."""
        mock_settings.exam_inactivity_timeout_seconds = 60

        service = self._make_service()
        now = datetime(2026, 10, 2, 12, 5, 0, tzinfo=timezone.utc)

        assignment = self._make_assignment(
            status=AssignmentStatus.IN_PROGRESS,
            last_activity_at=None,
        )

        result = service._lazy_pause_if_stale(assignment, now)

        self.assertFalse(result)

    @patch("app.services.exam_session_service.settings")
    def test_stale_session_then_unpause_shifts_deadline(self, mock_settings):
        """End-to-end: a stale session is lazily paused, then _unpause
        correctly shifts the deadline forward by the offline gap."""
        mock_settings.exam_inactivity_timeout_seconds = 60

        service = self._make_service()
        from datetime import timedelta

        last_heartbeat = datetime(2026, 10, 2, 12, 0, 0, tzinfo=timezone.utc)
        original_expires = datetime(2026, 10, 2, 13, 0, 0, tzinfo=timezone.utc)
        resume_time = datetime(2026, 10, 2, 12, 10, 0, tzinfo=timezone.utc)  # 10 min offline

        assignment = self._make_assignment(
            status=AssignmentStatus.IN_PROGRESS,
            last_activity_at=last_heartbeat,
        )
        assignment.expires_at = original_expires

        # Step 1: Lazy pause detects the stale session
        paused = service._lazy_pause_if_stale(assignment, resume_time)
        self.assertTrue(paused)
        self.assertEqual(assignment.paused_at, last_heartbeat)

        # Step 2: Unpause shifts the deadline forward
        service._unpause(assignment, resume_time)
        self.assertIsNone(assignment.paused_at)

        # The offline gap is 10 minutes (resume_time - last_heartbeat)
        expected_expires = original_expires + timedelta(minutes=10)
        self.assertEqual(assignment.expires_at, expected_expires)

    @patch("app.services.exam_session_service.settings")
    def test_exact_boundary_is_paused(self, mock_settings):
        """A session whose idle time is exactly equal to the timeout should
        be paused (the guard uses strict less-than: idle < threshold)."""
        mock_settings.exam_inactivity_timeout_seconds = 60

        service = self._make_service()
        from datetime import timedelta
        last_heartbeat = datetime(2026, 10, 2, 12, 0, 0, tzinfo=timezone.utc)
        now = last_heartbeat + timedelta(seconds=60)  # exactly at boundary

        assignment = self._make_assignment(
            status=AssignmentStatus.IN_PROGRESS,
            last_activity_at=last_heartbeat,
        )

        result = service._lazy_pause_if_stale(assignment, now)

        # At the boundary the session has been idle for exactly the timeout
        # duration, so it IS paused (consistent with the < comparison).
        self.assertTrue(result)
        self.assertEqual(assignment.paused_at, last_heartbeat)

    @patch("app.services.exam_session_service.settings")
    def test_one_second_past_boundary_pauses(self, mock_settings):
        """A session one second past the inactivity timeout should be paused."""
        mock_settings.exam_inactivity_timeout_seconds = 60

        service = self._make_service()
        from datetime import timedelta
        last_heartbeat = datetime(2026, 10, 2, 12, 0, 0, tzinfo=timezone.utc)
        now = last_heartbeat + timedelta(seconds=61)

        assignment = self._make_assignment(
            status=AssignmentStatus.IN_PROGRESS,
            last_activity_at=last_heartbeat,
        )

        result = service._lazy_pause_if_stale(assignment, now)

        self.assertTrue(result)
        self.assertEqual(assignment.paused_at, last_heartbeat)


if __name__ == "__main__":
    unittest.main()
