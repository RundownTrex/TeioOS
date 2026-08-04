"""add_system_settings_table

Revision ID: b1c2d3e4f5a6
Revises: a9b8c7d6e5f4
Create Date: 2026-08-03 15:30:00.000000
"""
from alembic import op
import sqlalchemy as sa
import uuid


# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5a6'
down_revision = 'a9b8c7d6e5f4'
branch_labels = None
depends_on = None

# Default system settings seeded on creation
DEFAULT_SETTINGS = [
    # Institution
    ("institution.name", "institution", "TeioOS Examination Centre", "Name of the institution"),
    ("institution.logo_url", "institution", None, "URL of the institution logo"),
    ("institution.default_exam_duration", "institution", "60", "Default examination duration in minutes"),
    ("institution.contact_email", "institution", None, "Contact email for the institution"),
    # Security
    ("security.password_min_length", "security", "8", "Minimum password length"),
    ("security.password_require_uppercase", "security", "true", "Require at least one uppercase letter"),
    ("security.password_require_number", "security", "true", "Require at least one number"),
    ("security.password_require_special", "security", "false", "Require at least one special character"),
    ("security.session_timeout_minutes", "security", "120", "Admin session timeout in minutes"),
    ("security.max_login_attempts", "security", "5", "Maximum failed login attempts before lockout"),
    # Appearance
    ("appearance.theme", "appearance", "system", "Dashboard colour theme (light|dark|system)"),
    ("appearance.primary_color", "appearance", "navy", "Primary brand colour token"),
    ("appearance.show_institution_logo", "appearance", "true", "Show institution logo in header"),
    # Examination
    ("exam.pass_threshold_percentage", "exam", "40", "Minimum percentage required to pass an examination"),
    ("exam.allow_result_review", "exam", "true", "Allow candidates to review their results"),
]


def upgrade() -> None:
    settings_table = op.create_table(
        'system_settings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('key', sa.String(128), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('category', sa.String(64), nullable=False, server_default='general'),
        sa.Column('description', sa.String(256), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id', name='pk_system_settings'),
        sa.UniqueConstraint('key', name='uq_system_settings_key'),
    )
    op.create_index('ix_system_settings_key', 'system_settings', ['key'])
    op.create_index('ix_system_settings_category', 'system_settings', ['category'])

    # Seed default settings
    op.bulk_insert(settings_table, [
        {
            "id": str(uuid.uuid4()),
            "key": key,
            "category": category,
            "value": value,
            "description": description,
        }
        for key, category, value, description in DEFAULT_SETTINGS
    ])


def downgrade() -> None:
    op.drop_index('ix_system_settings_category', table_name='system_settings')
    op.drop_index('ix_system_settings_key', table_name='system_settings')
    op.drop_table('system_settings')
