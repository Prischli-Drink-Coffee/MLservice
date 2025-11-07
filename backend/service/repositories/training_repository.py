import logging
from typing import Any
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from service.models.db.db_models import Dataset, ModelArtifact, TrainingRun, UserFile
from service.models.key_value import ProcessingStatus, ServiceMode
from service.repositories.base_repository import BaseRepository
from service.repositories.decorators.session_processor import connection

logger = logging.getLogger(__name__)


class TrainingRepository(BaseRepository):
    @connection()
    async def get_latest_user_file(
        self, user_id: UUID, mode: ServiceMode, session: AsyncSession | None = None
    ) -> UserFile | None:
        stmt = (
            select(UserFile)
            .where(UserFile.user_id == user_id, UserFile.mode == mode)
            .order_by(UserFile.created_at.desc())
            .limit(1)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @connection()
    async def get_or_create_dataset_from_file(
        self,
        user_id: UUID,
        launch_id: UUID | None,
        mode: ServiceMode,
        file_name: str,
        file_url: str,
        session: AsyncSession | None = None,
    ) -> Dataset:
        # Try find existing by file_url
        stmt = select(Dataset).where(Dataset.user_id == user_id, Dataset.file_url == file_url)
        result = await session.execute(stmt)
        ds = result.scalar_one_or_none()
        if ds:
            return ds

        ds = Dataset(
            user_id=user_id,
            launch_id=launch_id,
            mode=mode,
            name=file_name,
            file_url=file_url,
        )
        session.add(ds)
        await session.flush()
        return ds

    @connection()
    async def create_training_run(
        self,
        user_id: UUID,
        launch_id: UUID,
        dataset_id: UUID,
        status: ProcessingStatus,
        session: AsyncSession | None = None,
    ) -> TrainingRun:
        tr = TrainingRun(
            user_id=user_id,
            launch_id=launch_id,
            dataset_id=dataset_id,
            status=status,
        )
        session.add(tr)
        await session.flush()
        return tr

    @connection()
    async def update_training_run_status(
        self,
        run_id: UUID,
        status: ProcessingStatus,
        *,
        model_url: str | None = None,
        metrics: dict[str, Any] | None = None,
        session: AsyncSession | None = None,
    ) -> TrainingRun | None:
        values: dict[str, Any] = {"status": status}
        if model_url is not None:
            values["model_url"] = model_url
        if metrics is not None:
            values["metrics"] = metrics

        stmt = (
            update(TrainingRun)
            .where(TrainingRun.id == run_id)
            .values(**values)
            .returning(TrainingRun)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @connection()
    async def create_model_artifact(
        self,
        user_id: UUID,
        launch_id: UUID,
        model_url: str,
        metrics: dict[str, Any] | None = None,
        session: AsyncSession | None = None,
    ) -> ModelArtifact:
        art = ModelArtifact(
            user_id=user_id,
            launch_id=launch_id,
            model_url=model_url,
            metrics=metrics,
        )
        session.add(art)
        await session.flush()
        return art

    # Listing helpers for API
    @connection()
    async def list_training_runs(
        self, user_id: UUID, limit: int = 20, session: AsyncSession | None = None
    ) -> list[TrainingRun]:
        stmt = (
            select(TrainingRun)
            .where(TrainingRun.user_id == user_id)
            .order_by(TrainingRun.created_at.desc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @connection()
    async def list_artifacts(
        self, user_id: UUID, limit: int = 20, session: AsyncSession | None = None
    ) -> list[ModelArtifact]:
        stmt = (
            select(ModelArtifact)
            .where(ModelArtifact.user_id == user_id)
            .order_by(ModelArtifact.created_at.desc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @connection()
    async def list_datasets(
        self, user_id: UUID, limit: int = 20, session: AsyncSession | None = None
    ) -> list[Dataset]:
        stmt = (
            select(Dataset)
            .where(Dataset.user_id == user_id)
            .order_by(Dataset.created_at.desc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    # --- New helpers for Job API enrichment ---
    @connection()
    async def get_training_run_by_launch(
        self, user_id: UUID, launch_id: UUID, session: AsyncSession | None = None
    ) -> TrainingRun | None:
        stmt = (
            select(TrainingRun)
            .where(TrainingRun.user_id == user_id, TrainingRun.launch_id == launch_id)
            .order_by(TrainingRun.created_at.desc())
            .limit(1)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @connection()
    async def get_model_artifact_by_launch(
        self, user_id: UUID, launch_id: UUID, session: AsyncSession | None = None
    ) -> ModelArtifact | None:
        stmt = (
            select(ModelArtifact)
            .where(ModelArtifact.user_id == user_id, ModelArtifact.launch_id == launch_id)
            .order_by(ModelArtifact.created_at.desc())
            .limit(1)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()
