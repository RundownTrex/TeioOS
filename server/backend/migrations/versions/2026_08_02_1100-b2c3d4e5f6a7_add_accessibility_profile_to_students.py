"""add accessibility_profile to students

Accessibility is a primary research objective of TeioOS: each student carries an
accessibility profile (standard, screen_reader, high_contrast, large_text,
reduced_motion) so the examination client can apply accommodations per candidate
without per-exam administrator intervention.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # NOT NULL with server default so existing rows adopt "standard".
    op.add_column(
        "students",
        sa.Column(
            "accessibility_profile",
            sa.String(length=50),
            nullable=False,
            server_default="standard",
        ),
    )


def downgrade() -> None:
    op.drop_column("students", "accessibility_profile")
