"""add paused_at to student_exams

Candidate-leave support: while paused_at is set the candidate's individual
timer is frozen; on resume expires_at is shifted forward by the pause duration
so examination time is only counted while the candidate is actively giving the
exam.

Revision ID: a1b2c3d4e5f6
Revises: c9d4f8a1b2e3
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "c9d4f8a1b2e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # NULL = session actively counting down; set = timer frozen (candidate away).
    op.add_column(
        "student_exams",
        sa.Column("paused_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("student_exams", "paused_at")
