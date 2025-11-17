"""Add payload column to profile.user_launch

Revision ID: 007_add_job_payload
Revises: 006_add_dataset_storage_key
Create Date: 2025-11-17 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007_add_job_payload"
down_revision: Union[str, Sequence[str], None] = "006_add_dataset_storage_key"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_launch",
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        schema="profile",
    )


def downgrade() -> None:
    op.drop_column("user_launch", "payload", schema="profile")
