"""add_qa_cache_table

Revision ID: a3b7e2c4d901
Revises: 8fd11c9afbc0
Create Date: 2026-02-05 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'a3b7e2c4d901'
down_revision: Union[str, None] = '8fd11c9afbc0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'qa_cache' not in existing_tables:
        op.create_table('qa_cache',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('machinery_id', sa.String(length=50), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('embedding', sa.JSON(), nullable=False),
        sa.Column('hit_count', sa.Integer(), nullable=False),
        sa.Column('quality_score', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_used_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
        )

    existing_indexes = [idx['name'] for idx in inspector.get_indexes('qa_cache')]
    if 'ix_qa_cache_machinery_id' not in existing_indexes:
        with op.batch_alter_table('qa_cache', schema=None) as batch_op:
            batch_op.create_index(batch_op.f('ix_qa_cache_machinery_id'), ['machinery_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('qa_cache', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_qa_cache_machinery_id'))

    op.drop_table('qa_cache')
