"""Add storage_key column to profile.dataset

Revision ID: 006_add_dataset_storage_key
Revises: 005_add_dataset_version_column
Create Date: 2025-11-17 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_add_dataset_storage_key"
down_revision: Union[str, Sequence[str], None] = "005_add_dataset_version_column"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "dataset",
        sa.Column("storage_key", sa.String(length=1000), nullable=True),
        schema="profile",
    )
    # Backfill existing rows to keep references to storage files
    op.execute("UPDATE profile.dataset SET storage_key = name WHERE storage_key IS NULL")
    op.alter_column("dataset", "storage_key", schema="profile", nullable=False)


def downgrade() -> None:
    op.drop_column("dataset", "storage_key", schema="profile")
