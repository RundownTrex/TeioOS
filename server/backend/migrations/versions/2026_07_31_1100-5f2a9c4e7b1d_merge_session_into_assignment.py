"""merge per-candidate timing into student exam assignments

Revision ID: 5f2a9c4e7b1d
Revises: ad1ef8173514
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "5f2a9c4e7b1d"
down_revision: Union[str, Sequence[str], None] = "ad1ef8173514"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    assignment_status = sa.Enum(
        "pending", "in_progress", "submitted", "auto_submitted", "expired", "terminated",
        name="assignmentstatus",
    )
    assignment_status.create(bind, checkfirst=True)

    # Add the candidate timer/state to the existing assignment rows.
    op.add_column("student_exams", sa.Column("started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("student_exams", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("student_exams", sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("student_exams", sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("student_exams", sa.Column("status", assignment_status, nullable=False, server_default="pending"))
    op.add_column("student_exams", sa.Column("resume_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("student_exams", sa.Column("is_auto_submitted", sa.Boolean(), nullable=False, server_default=sa.text("false")))

    # Migrate legacy session state. The old schema has no individual expiry;
    # derive it from the original start and the exam duration exactly once.
    op.execute("""
        UPDATE student_exams se
        SET started_at = es.start_time,
            expires_at = CASE
                WHEN es.start_time IS NOT NULL THEN es.start_time + make_interval(mins => e.duration_minutes)
                ELSE NULL
            END,
            submitted_at = es.submit_time,
            last_activity_at = COALESCE(es.submit_time, es.start_time),
            status = (
                CASE
                    WHEN es.is_auto_submitted THEN 'auto_submitted'
                    WHEN es.status::text = 'PENDING' THEN 'pending'
                    WHEN es.status::text = 'IN_PROGRESS' THEN 'in_progress'
                    WHEN es.status::text = 'SUBMITTED' THEN 'submitted'
                    WHEN es.status::text = 'EXPIRED' THEN 'expired'
                    WHEN es.status::text = 'TERMINATED' THEN 'terminated'
                    ELSE 'pending'
                END
            )::assignmentstatus,
            resume_count = CASE WHEN es.start_time IS NULL THEN 0 ELSE 1 END,
            is_auto_submitted = es.is_auto_submitted
        FROM exam_sessions es
        JOIN exam_schedules sched ON sched.id = es.exam_schedule_id
        JOIN exams e ON e.id = sched.exam_id
        WHERE se.student_id = es.student_id
          AND se.exam_schedule_id = es.exam_schedule_id
    """)

    # Move answer ownership from legacy session IDs to assignment IDs.
    op.add_column("student_answers", sa.Column("student_exam_id", sa.Uuid(), nullable=True))
    op.execute("""
        UPDATE student_answers ans
        SET student_exam_id = assignment.id
        FROM exam_sessions legacy
        JOIN student_exams assignment
          ON assignment.student_id = legacy.student_id
         AND assignment.exam_schedule_id = legacy.exam_schedule_id
        WHERE ans.exam_session_id = legacy.id
    """)
    op.drop_constraint("uq_session_question_answer", "student_answers", type_="unique")
    op.drop_constraint("fk_student_answers_exam_session_id_exam_sessions", "student_answers", type_="foreignkey")
    op.drop_index("ix_student_answers_exam_session_id", table_name="student_answers")
    op.drop_column("student_answers", "exam_session_id")
    op.alter_column("student_answers", "student_exam_id", nullable=False)
    op.create_index("ix_student_answers_student_exam_id", "student_answers", ["student_exam_id"], unique=False)
    op.create_foreign_key(
        "fk_student_answers_student_exam_id_student_exams",
        "student_answers", "student_exams", ["student_exam_id"], ["id"], ondelete="CASCADE",
    )
    op.create_unique_constraint(
        "uq_student_exam_question_answer", "student_answers", ["student_exam_id", "question_id"],
    )

    # Move result ownership from legacy session IDs to assignment IDs.
    op.add_column("results", sa.Column("student_exam_id", sa.Uuid(), nullable=True))
    op.execute("""
        UPDATE results result
        SET student_exam_id = assignment.id
        FROM exam_sessions legacy
        JOIN student_exams assignment
          ON assignment.student_id = legacy.student_id
         AND assignment.exam_schedule_id = legacy.exam_schedule_id
        WHERE result.exam_session_id = legacy.id
    """)
    op.drop_constraint("fk_results_exam_session_id_exam_sessions", "results", type_="foreignkey")
    op.drop_index("ix_results_exam_session_id", table_name="results")
    op.drop_column("results", "exam_session_id")
    op.alter_column("results", "student_exam_id", nullable=False)
    op.create_index("ix_results_student_exam_id", "results", ["student_exam_id"], unique=True)
    op.create_foreign_key(
        "fk_results_student_exam_id_student_exams",
        "results", "student_exams", ["student_exam_id"], ["id"], ondelete="CASCADE",
    )

    op.drop_table("exam_sessions")
    sa.Enum(name="sessionstatus").drop(bind, checkfirst=True)


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported for the session-to-assignment data migration")
