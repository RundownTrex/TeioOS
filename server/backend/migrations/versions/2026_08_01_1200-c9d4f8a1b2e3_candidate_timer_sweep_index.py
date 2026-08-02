"""candidate timer sweep index and legacy timer backfill

Revision ID: c9d4f8a1b2e3
Revises: 5f2a9c4e7b1d
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c9d4f8a1b2e3"
down_revision: Union[str, Sequence[str], None] = "5f2a9c4e7b1d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Index backing the server-side auto-submit sweep over expired sessions.
    op.create_index(
        "ix_student_exams_status_expires_at",
        "student_exams",
        ["status", "expires_at"],
        unique=False,
    )

    # Defensive backfill: any in-progress session missing its individual timer
    # is derived exactly once from its recorded start and the exam duration.
    # expires_at is never recomputed afterwards.
    op.execute(
        """
        UPDATE student_exams se
        SET started_at = COALESCE(se.started_at, sched.start_time),
            expires_at = COALESCE(
                se.expires_at,
                COALESCE(se.started_at, sched.start_time)
                    + make_interval(mins => e.duration_minutes)
            ),
            last_activity_at = COALESCE(
                se.last_activity_at,
                COALESCE(se.started_at, sched.start_time)
            ),
            resume_count = CASE
                WHEN se.resume_count = 0 THEN 1
                ELSE se.resume_count
            END
        FROM exam_schedules sched
        JOIN exams e ON e.id = sched.exam_id
        WHERE se.exam_schedule_id = sched.id
          AND se.status = 'in_progress'
          AND (se.started_at IS NULL OR se.expires_at IS NULL)
        """
    )


def downgrade() -> None:
    op.drop_index("ix_student_exams_status_expires_at", table_name="student_exams")
