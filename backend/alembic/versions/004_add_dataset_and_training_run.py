"""Add profile.dataset and profile.training_run tables

Revision ID: 004_add_dataset_and_training_run
Revises: 003_add_model_artifact
Create Date: 2025-11-07 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004_add_dataset_and_training_run"
down_revision: Union[str, Sequence[str], None] = "003_add_model_artifact"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS profile")

    # dataset table
    op.create_table(
        "dataset",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("user_id", postgresql.UUID(), nullable=False),
        sa.Column("launch_id", postgresql.UUID(), nullable=True),
        sa.Column("mode", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("file_url", sa.String(length=1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["profile.user.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["launch_id"], ["profile.user_launch.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        schema="profile",
    )
    op.create_index(
        "ix_profile_dataset_user_id",
        "dataset",
        ["user_id"],
        unique=False,
        schema="profile",
    )
    op.create_index(
        "ix_profile_dataset_launch_id",
        "dataset",
        ["launch_id"],
        unique=False,
        schema="profile",
    )

    # training_run table
    op.create_table(
        "training_run",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("user_id", postgresql.UUID(), nullable=False),
        sa.Column("launch_id", postgresql.UUID(), nullable=False),
        sa.Column("dataset_id", postgresql.UUID(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("model_url", sa.String(length=1000), nullable=True),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["profile.user.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["launch_id"], ["profile.user_launch.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["dataset_id"], ["profile.dataset.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        schema="profile",
    )
    op.create_index(
        "ix_profile_training_run_user_id",
        "training_run",
        ["user_id"],
        unique=False,
        schema="profile",
    )
    op.create_index(
        "ix_profile_training_run_launch_id",
        "training_run",
        ["launch_id"],
        unique=False,
        schema="profile",
    )
    op.create_index(
        "ix_profile_training_run_dataset_id",
        "training_run",
        ["dataset_id"],
        unique=False,
        schema="profile",
    )


def downgrade() -> None:
    op.drop_index("ix_profile_training_run_dataset_id", table_name="training_run", schema="profile")
    op.drop_index("ix_profile_training_run_launch_id", table_name="training_run", schema="profile")
    op.drop_index("ix_profile_training_run_user_id", table_name="training_run", schema="profile")
    op.drop_table("training_run", schema="profile")

    op.drop_index("ix_profile_dataset_launch_id", table_name="dataset", schema="profile")
    op.drop_index("ix_profile_dataset_user_id", table_name="dataset", schema="profile")
    op.drop_table("dataset", schema="profile")
