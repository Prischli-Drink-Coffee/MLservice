"""Initial migration with password support

Revision ID: 001_initial
Revises:
Create Date: 2025-09-24 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create profile schema
    op.execute('CREATE SCHEMA IF NOT EXISTS profile')

    # Create session schema
    op.execute('CREATE SCHEMA IF NOT EXISTS session')

    # Create user table
    op.create_table('user',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('email', sa.String(length=500), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.BigInteger(), nullable=True),
        sa.Column('first_name', sa.String(length=50), nullable=True),
        sa.Column('available_launches', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        schema='profile',
        comment='User profiles with password authentication'
    )

    # Create user_launch table
    op.create_table('user_launch',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('user_id', postgresql.UUID(), nullable=False),
        sa.Column('mode', sa.String(length=50), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('is_payment_taken', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['profile.user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='profile'
    )
    op.create_index('ix_profile_user_launch_user_id', 'user_launch', ['user_id'], schema='profile')

    # Create user_session table
    op.create_table('user_session',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('user_id', postgresql.UUID(), nullable=False),
        sa.Column('fingerprint', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('token', sa.String(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('session_code', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        schema='session'
    )
    op.create_index('ix_session_user_session_user_id', 'user_session', ['user_id'], schema='session')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_session_user_session_user_id', table_name='user_session', schema='session')
    op.drop_table('user_session', schema='session')

    op.drop_index('ix_profile_user_launch_user_id', table_name='user_launch', schema='profile')
    op.drop_table('user_launch', schema='profile')
    op.drop_table('user', schema='profile')

    op.execute('DROP SCHEMA IF EXISTS session CASCADE')
    op.execute('DROP SCHEMA IF EXISTS profile CASCADE')
