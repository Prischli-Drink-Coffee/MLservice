from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from service.models.db.base_db_model import Base
from service.models.key_value import (
    ProcessingStatus,
    ServiceMode,
    ServiceType,
    SessionStatus,
)


class User(Base):
    __tablename__ = "user"
    __table_args__ = {"schema": "profile"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4, comment="Unique user identifier"
    )
    email: Mapped[str] = mapped_column(String(500), unique=True, comment="User email address")
    password_hash: Mapped[str] = mapped_column(String(255), comment="Hashed user password")
    phone: Mapped[int | None] = mapped_column(BigInteger, comment="User phone number")
    first_name: Mapped[str | None] = mapped_column(String(50), comment="User first name")
    available_launches: Mapped[int] = mapped_column(comment="Number of available launches")

    user_launches: Mapped[list["UserLaunch"]] = relationship(
        cascade="all, delete-orphan",
        back_populates="user",
        lazy="selectin",
    )

    # Files owned by the user
    user_files: Mapped[list["UserFile"]] = relationship(
        cascade="all, delete-orphan",
        back_populates="user",
        lazy="selectin",
    )

    # Note: legacy ML models removed; will be reintroduced with new design


class UserLaunch(Base):
    __tablename__ = "user_launch"
    __table_args__ = {"schema": "profile"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4, comment="Unique launch identifier"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profile.user.id", ondelete="CASCADE"),
        index=True,
        comment="Reference to user",
    )
    mode: Mapped[ServiceMode] = mapped_column(String(50), comment="Launch mode type")
    type: Mapped[ServiceType] = mapped_column(String(50), comment="Launch type")
    status: Mapped[ProcessingStatus] = mapped_column(String(50), comment="Launch status")
    is_payment_taken: Mapped[bool] = mapped_column(
        default=False, comment="Flag indicating if payment was taken"
    )
    payload: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True, comment="Optional JSON payload with job parameters"
    )

    user: Mapped["User"] = relationship(
        back_populates="user_launches",
        lazy="selectin",
    )


class UserSession(Base):
    __tablename__ = "user_session"
    __table_args__ = {"schema": "session"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4, comment="Unique session identifier"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID, index=True, comment="Reference to user")
    fingerprint: Mapped[str | None] = mapped_column(String(50), comment="Browser fingerprint hash")
    user_agent: Mapped[str | None] = mapped_column(String(255), comment="Browser user agent string")
    status: Mapped[SessionStatus] = mapped_column(String, comment="Session status")
    token: Mapped[str | None] = mapped_column(String, comment="Session authentication token")
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), comment="Session expiration timestamp"
    )
    session_code: Mapped[str] = mapped_column(String, comment="Session verification code")


# Legacy ML/Graph models removed pending redesign (see docs/backend_audit.md)


class UserFile(Base):
    __tablename__ = "user_file"
    __table_args__ = {"schema": "profile"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4, comment="Unique image identifier"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profile.user.id", ondelete="CASCADE"),
        index=True,
        comment="Reference to user",
    )
    mode: Mapped[ServiceMode] = mapped_column(String(50), comment="mode type")
    file_name: Mapped[str] = mapped_column(String(1000), comment="file name")
    file_url: Mapped[str] = mapped_column(String(1000), comment="file path or URL")

    user: Mapped["User"] = relationship(
        back_populates="user_files",
        lazy="selectin",
    )


## Removed deprecated MLJobState / MLModel / MLExecution


class ModelArtifact(Base):
    __tablename__ = "model_artifact"
    __table_args__ = {"schema": "profile"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4, comment="Unique artifact identifier"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profile.user.id", ondelete="CASCADE"),
        index=True,
        comment="Reference to user",
    )
    launch_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profile.user_launch.id", ondelete="CASCADE"),
        index=True,
        comment="Reference to related job (user_launch)",
    )
    model_url: Mapped[str] = mapped_column(String(1000), comment="Stored model file path/URL")
    metrics: Mapped[dict | None] = mapped_column(JSONB, comment="Training metrics JSON")

    user: Mapped["User"] = relationship(lazy="selectin")
    launch: Mapped["UserLaunch"] = relationship(lazy="selectin")


class Dataset(Base):
    __tablename__ = "dataset"
    __table_args__ = {"schema": "profile"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4, comment="Unique dataset identifier"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profile.user.id", ondelete="CASCADE"),
        index=True,
        comment="Owner user id",
    )
    launch_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("profile.user_launch.id", ondelete="SET NULL"),
        index=True,
        comment="Optional related launch",
    )
    mode: Mapped[ServiceMode] = mapped_column(String(50), comment="Dataset mode type")
    name: Mapped[str] = mapped_column(String(255), comment="Human-friendly dataset name")
    storage_key: Mapped[str] = mapped_column(
        String(1000), comment="Internal storage file key for presigned downloads"
    )
    file_url: Mapped[str] = mapped_column(String(1000), comment="Stored dataset file path/URL")
    version: Mapped[int] = mapped_column(
        default=1, comment="Sequential dataset version per user+mode"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, comment="Creation timestamp"
    )

    user: Mapped["User"] = relationship(lazy="selectin")
    launch: Mapped[UserLaunch | None] = relationship(lazy="selectin")


class TrainingRun(Base):
    __tablename__ = "training_run"
    __table_args__ = {"schema": "profile"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4, comment="Unique training run identifier"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profile.user.id", ondelete="CASCADE"),
        index=True,
        comment="Owner user id",
    )
    launch_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profile.user_launch.id", ondelete="CASCADE"),
        index=True,
        comment="Related job (user_launch)",
    )
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profile.dataset.id", ondelete="RESTRICT"),
        index=True,
        comment="Input dataset",
    )
    status: Mapped[ProcessingStatus] = mapped_column(String(50), comment="Run status")
    model_url: Mapped[str | None] = mapped_column(String(1000), comment="Produced model path/URL")
    metrics: Mapped[dict | None] = mapped_column(JSONB, comment="Training metrics JSON")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, comment="Creation timestamp"
    )

    user: Mapped["User"] = relationship(lazy="selectin")
    launch: Mapped["UserLaunch"] = relationship(lazy="selectin")
    dataset: Mapped["Dataset"] = relationship(lazy="selectin")


# class TelegramBot(Base):
#     __tablename__ = "telegram_bot"
#     __table_args__ = {"schema": "telegram"}

#     id: Mapped[uuid.UUID] = mapped_column(
#         UUID, primary_key=True, default=uuid.uuid4, comment="Unique bot identifier"
#     )
#     user_id: Mapped[uuid.UUID] = mapped_column(
#         ForeignKey("profile.user.id", ondelete="CASCADE"),
#         index=True,
#         comment="Reference to user who owns this bot",
#     )
#     name: Mapped[str] = mapped_column(String(255), comment="Bot display name")
#     token: Mapped[str] = mapped_column(
#         String(500), unique=True, index=True, comment="Telegram bot API token"
#     )
#     username: Mapped[str | None] = mapped_column(
#         String(255), index=True, comment="Telegram bot username"
#     )
#     description: Mapped[str | None] = mapped_column(Text, comment="Bot description")
#     webhook_url: Mapped[str | None] = mapped_column(String(1000), comment="Webhook URL")
#     is_active: Mapped[bool] = mapped_column(Boolean, default=False, comment="Whether bot is active")
#     settings: Mapped[dict | None] = mapped_column(JSONB, comment="Bot configuration settings")
#     job_status: Mapped[str] = mapped_column(
#         String(50),
#         default="STOPPED",
#         comment="Job status: RUNNING, PAUSED, STOPPED, ERROR, STARTING",
#     )
#     graph_ids: Mapped[list[uuid.UUID] | None] = mapped_column(
#         ARRAY(UUID), default=list, comment="List of graph IDs used by this bot"
#     )

#     user: Mapped["User"] = relationship(back_populates="telegram_bots", lazy="selectin")
#     triggers: Mapped[list["TelegramTrigger"]] = relationship(
#         cascade="all, delete-orphan", back_populates="bot", lazy="selectin"
#     )
#     message_queues: Mapped[list["TelegramMessageQueue"]] = relationship(
#         cascade="all, delete-orphan", back_populates="bot", lazy="selectin"
#     )
