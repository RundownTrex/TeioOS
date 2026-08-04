"""Add instructions and status to exams.

Revision ID: f1e2d3c4b5a6
Revises: c1d2e3f4a5b6
Create Date: 2026-08-03 14:00:00

Adds instructions (Text) and status (String(20), default 'draft') columns to exams table.
"""
from alembic import op
import sqlalchemy as sa

revision = "f1e2d3c4b5a6"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "exams",
        sa.Column("instructions", sa.Text(), nullable=True),
    )
    op.add_column(
        "exams",
        sa.Column("status", sa.String(length=20), server_default="draft", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("exams", "status")
    op.drop_column("exams", "instructions")
