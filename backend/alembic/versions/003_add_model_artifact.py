"""Add profile.model_artifact table

Revision ID: 003_add_model_artifact
Revises: 002_add_user_file
Create Date: 2025-11-07 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_add_model_artifact"
down_revision: Union[str, Sequence[str], None] = "002_add_user_file"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS profile")

    op.create_table(
        "model_artifact",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("user_id", postgresql.UUID(), nullable=False),
        sa.Column("launch_id", postgresql.UUID(), nullable=False),
        sa.Column("model_url", sa.String(length=1000), nullable=False),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["profile.user.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["launch_id"], ["profile.user_launch.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="profile",
    )
    op.create_index(
        "ix_profile_model_artifact_user_id",
        "model_artifact",
        ["user_id"],
        unique=False,
        schema="profile",
    )
    op.create_index(
        "ix_profile_model_artifact_launch_id",
        "model_artifact",
        ["launch_id"],
        unique=False,
        schema="profile",
    )


def downgrade() -> None:
    op.drop_index("ix_profile_model_artifact_launch_id", table_name="model_artifact", schema="profile")
    op.drop_index("ix_profile_model_artifact_user_id", table_name="model_artifact", schema="profile")
    op.drop_table("model_artifact", schema="profile")
