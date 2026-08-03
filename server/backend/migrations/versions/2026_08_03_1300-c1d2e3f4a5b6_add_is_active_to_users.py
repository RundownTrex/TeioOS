"""Add is_active to users.

Revision ID: c1d2e3f4a5b6
Revises: e3f4a5b6c7d8
Create Date: 2026-08-03 13:00:00

Adds is_active column to users table with default value true.
"""
from alembic import op
import sqlalchemy as sa

revision = "c1d2e3f4a5b6"
down_revision = "e3f4a5b6c7d8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "is_active")
