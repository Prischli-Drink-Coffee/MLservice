"""Add version column to profile.dataset

Revision ID: 005_add_dataset_version_column
Revises: 004_add_dataset_and_training_run
Create Date: 2025-11-07 00:30:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "005_add_dataset_version_column"
down_revision: Union[str, Sequence[str], None] = "004_add_dataset_and_training_run"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "dataset",
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        schema="profile",
    )
    # Ensure all existing rows have version=1 explicitly (server_default handles new)
    op.execute("UPDATE profile.dataset SET version = 1 WHERE version IS NULL")
    # Optional index to speed up per-user version queries
    op.create_index(
        "ix_profile_dataset_user_mode_version",
        "dataset",
        ["user_id", "mode", "version"],
        unique=False,
        schema="profile",
    )


def downgrade() -> None:
    op.drop_index("ix_profile_dataset_user_mode_version", table_name="dataset", schema="profile")
    op.drop_column("dataset", "version", schema="profile")
