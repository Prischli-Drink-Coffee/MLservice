"""Add profile.user_file table

Revision ID: 002_add_user_file
Revises: 001_initial
Create Date: 2025-11-06 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_add_user_file"
down_revision: Union[str, Sequence[str], None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure schema exists
    op.execute("CREATE SCHEMA IF NOT EXISTS profile")

    # Create user_file table
    op.create_table(
        "user_file",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("user_id", postgresql.UUID(), nullable=False),
        sa.Column("mode", sa.String(length=50), nullable=False),
        sa.Column("file_name", sa.String(length=1000), nullable=False),
        sa.Column("file_url", sa.String(length=1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["profile.user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="profile",
    )
    op.create_index(
        "ix_profile_user_file_user_id",
        "user_file",
        ["user_id"],
        unique=False,
        schema="profile",
    )


def downgrade() -> None:
    op.drop_index("ix_profile_user_file_user_id", table_name="user_file", schema="profile")
    op.drop_table("user_file", schema="profile")
