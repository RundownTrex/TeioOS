"""Add title and question_count support to exams.

Revision ID: d4e5f6a7b8c9
Revises: b2c3d4e5f6a7
Create Date: 2026-08-02 12:00:00

Adds the optional exams.title column used by the Exam Management module.
question_count is computed by the repository and needs no schema change.
"""
from alembic import op
import sqlalchemy as sa

revision = "d4e5f6a7b8c9"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("exams", sa.Column("title", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("exams", "title")
