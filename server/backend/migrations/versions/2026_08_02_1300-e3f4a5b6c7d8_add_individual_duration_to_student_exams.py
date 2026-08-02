"""Add individual_duration_minutes to student_exams.

Revision ID: e3f4a5b6c7d8
Revises: d4e5f6a7b8c9
Create Date: 2026-08-02 13:00:00

Adds the optional per-student exam time override used by the Scheduling
module. NULL means the session deadline is computed from the exam's
duration_minutes as before.
"""
from alembic import op
import sqlalchemy as sa

revision = "e3f4a5b6c7d8"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "student_exams",
        sa.Column("individual_duration_minutes", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("student_exams", "individual_duration_minutes")
