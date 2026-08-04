"""add_mcq_and_descriptive_score_to_results

Revision ID: a9b8c7d6e5f4
Revises: f1e2d3c4b5a6
Create Date: 2026-08-03 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a9b8c7d6e5f4'
down_revision = 'f1e2d3c4b5a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('results', sa.Column('mcq_score', sa.Float(), server_default='0.0', nullable=False))
    op.add_column('results', sa.Column('descriptive_score', sa.Float(), server_default='0.0', nullable=False))


def downgrade() -> None:
    op.drop_column('results', 'descriptive_score')
    op.drop_column('results', 'mcq_score')
