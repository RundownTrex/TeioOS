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
from app.services.result_calculation_service import ResultCalculationService
from app.services.evaluation_service import EvaluationService
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
    @patch("app.api.routes.student.speech.logger")
    def test_empty_transcription_raises_503(self, _mock_logger):
        import asyncio
        from fastapi import HTTPException
        from app.api.routes.student.speech import transcribe_student_audio
        from app.schemas.token import TokenPayload

        mock_file = MagicMock()
        mock_file.filename = "dictation.webm"

        async def fake_read():
            return b"fake audio payload"

        mock_file.read = fake_read

        payload = TokenPayload(
            sub=str(uuid.uuid4()),
            role="student",
            exam_session_id=str(uuid.uuid4()),
            exam_schedule_id=str(uuid.uuid4()),
        )

        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(transcribe_student_audio(token_payload=payload, file=mock_file))

        self.assertEqual(ctx.exception.status_code, 503)
        self.assertIn("unavailable offline", ctx.exception.detail)


if __name__ == "__main__":
    unittest.main()
