"""add_descriptive_questions_and_evaluation_status

Revision ID: ad1ef8173514
Revises: dc4b831858c5
Create Date: 2026-07-24 21:56:32.151510

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ad1ef8173514'
down_revision: Union[str, Sequence[str], None] = 'dc4b831858c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create Postgres Enum Types
    questiontype_enum = sa.Enum('MCQ', 'DESCRIPTIVE', name='questiontype')
    questiontype_enum.create(op.get_bind(), checkfirst=True)

    evaluationstatus_enum = sa.Enum('PENDING', 'PARTIALLY_EVALUATED', 'COMPLETED', name='evaluationstatus')
    evaluationstatus_enum.create(op.get_bind(), checkfirst=True)

    # Create Columns & Indexes
    op.add_column('questions', sa.Column('question_type', questiontype_enum, nullable=False, server_default='MCQ'))
    op.add_column('questions', sa.Column('max_characters', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_questions_question_type'), 'questions', ['question_type'], unique=False)
    
    op.add_column('results', sa.Column('evaluation_status', evaluationstatus_enum, nullable=False, server_default='COMPLETED'))
    op.create_index(op.f('ix_results_evaluation_status'), 'results', ['evaluation_status'], unique=False)
    
    op.add_column('student_answers', sa.Column('answer_text', sa.Text(), nullable=True))
    op.add_column('student_answers', sa.Column('awarded_marks', sa.Float(), nullable=True))
    op.add_column('student_answers', sa.Column('evaluator_feedback', sa.Text(), nullable=True))
    op.add_column('student_answers', sa.Column('evaluated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('student_answers', sa.Column('evaluated_by', sa.Uuid(), nullable=True))
    op.alter_column('student_answers', 'selected_option_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.create_index(op.f('ix_student_answers_evaluated_by'), 'student_answers', ['evaluated_by'], unique=False)
    op.create_foreign_key(op.f('fk_student_answers_evaluated_by_users'), 'student_answers', 'users', ['evaluated_by'], ['id'], ondelete='SET NULL')

    # Create Check Constraints
    op.create_check_constraint(
        'ck_questions_max_characters_positive',
        'questions',
        'max_characters IS NULL OR max_characters > 0'
    )
    op.create_check_constraint(
        'ck_questions_mcq_no_max_chars',
        'questions',
        "question_type != 'MCQ' OR max_characters IS NULL"
    )
    op.create_check_constraint(
        'ck_student_answers_choice_or_text',
        'student_answers',
        'selected_option_id IS NULL OR answer_text IS NULL'
    )
    op.create_check_constraint(
        'ck_student_answers_awarded_marks_non_negative',
        'student_answers',
        'awarded_marks IS NULL OR awarded_marks >= 0'
    )



def downgrade() -> None:
    """Downgrade schema."""
    # Drop Check Constraints
    op.drop_constraint('ck_student_answers_awarded_marks_non_negative', 'student_answers', type_='check')
    op.drop_constraint('ck_student_answers_choice_or_text', 'student_answers', type_='check')
    op.drop_constraint('ck_questions_mcq_no_max_chars', 'questions', type_='check')
    op.drop_constraint('ck_questions_max_characters_positive', 'questions', type_='check')

    # Drop Foreign Keys & Columns
    op.drop_constraint(op.f('fk_student_answers_evaluated_by_users'), 'student_answers', type_='foreignkey')
    op.drop_index(op.f('ix_student_answers_evaluated_by'), table_name='student_answers')
    op.alter_column('student_answers', 'selected_option_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.drop_column('student_answers', 'evaluated_by')
    op.drop_column('student_answers', 'evaluated_at')
    op.drop_column('student_answers', 'evaluator_feedback')
    op.drop_column('student_answers', 'awarded_marks')
    op.drop_column('student_answers', 'answer_text')
    
    op.drop_index(op.f('ix_results_evaluation_status'), table_name='results')
    op.drop_column('results', 'evaluation_status')
    
    op.drop_index(op.f('ix_questions_question_type'), table_name='questions')
    op.drop_column('questions', 'max_characters')
    op.drop_column('questions', 'question_type')

    # Drop Postgres Enum Types
    sa.Enum(name='evaluationstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='questiontype').drop(op.get_bind(), checkfirst=True)

