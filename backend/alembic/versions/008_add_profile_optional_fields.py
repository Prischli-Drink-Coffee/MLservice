"""Add company/timezone/avatar fields to profile.user

Revision ID: 008_add_profile_optional_fields
Revises: 007_add_job_payload
Create Date: 2025-11-18 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "008_add_profile_optional_fields"
down_revision: Union[str, Sequence[str], None] = "007_add_job_payload"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE_NAME = "user"
SCHEMA = "profile"


NEW_COLUMNS = (
    sa.Column("company", sa.String(length=255), nullable=True, comment="User company name"),
    sa.Column(
        "timezone",
        sa.String(length=50),
        nullable=True,
        comment="Preferred timezone name",
    ),
    sa.Column(
        "avatar_url",
        sa.String(length=1000),
        nullable=True,
        comment="Public avatar URL",
    ),
)


def upgrade() -> None:
    for column in NEW_COLUMNS:
        op.add_column(TABLE_NAME, column.copy(), schema=SCHEMA)


def downgrade() -> None:
    for column in reversed(NEW_COLUMNS):
        op.drop_column(TABLE_NAME, column.name, schema=SCHEMA)
