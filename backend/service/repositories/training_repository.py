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
        # Deprecated semantics: previously reused dataset by file_url. Now always create new with version.
        return await self.create_dataset_with_version(
            user_id=user_id,
            launch_id=launch_id,
            mode=mode,
            file_name=file_name,
            file_url=file_url,
            session=session,
        )

    @connection()
    async def create_dataset_with_version(
        self,
        user_id: UUID,
        launch_id: UUID | None,
        mode: ServiceMode,
        file_name: str,
        file_url: str,
        session: AsyncSession | None = None,
    ) -> Dataset:
        # Fetch max version for this user+mode
        from sqlalchemy import func

        v_stmt = select(func.max(Dataset.version)).where(
            Dataset.user_id == user_id, Dataset.mode == mode
        )
        v_res = await session.execute(v_stmt)
        current_max = v_res.scalar()
        next_version = (current_max or 0) + 1
        ds = Dataset(
            user_id=user_id,
            launch_id=launch_id,
            mode=mode,
            name=file_name,
            file_url=file_url,
            version=next_version,
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
    async def count_artifacts(self, user_id: UUID, session: AsyncSession | None = None) -> int:
        from sqlalchemy import func

        stmt = select(func.count(ModelArtifact.id)).where(ModelArtifact.user_id == user_id)
        result = await session.execute(stmt)
        return int(result.scalar() or 0)

    @connection()
    async def delete_oldest_artifacts(
        self,
        user_id: UUID,
        keep: int,
        session: AsyncSession | None = None,
    ) -> list[str]:
        """Delete artifacts beyond 'keep' newest.

        Returns list of model_url values that were deleted from DB so that caller can remove files.
        """
        # Select IDs + model_url to delete (offset keep)
        ids_stmt = (
            select(ModelArtifact.id, ModelArtifact.model_url)
            .where(ModelArtifact.user_id == user_id)
            .order_by(ModelArtifact.created_at.desc())
            .offset(keep)
        )
        ids_result = await session.execute(ids_stmt)
        rows = ids_result.fetchall()
        if not rows:
            return []
        ids = [row[0] for row in rows]
        urls = [row[1] for row in rows]
        from sqlalchemy import delete

        del_stmt = delete(ModelArtifact).where(ModelArtifact.id.in_(ids))
        await session.execute(del_stmt)
        return urls

    @connection()
    async def delete_artifact(
        self, user_id: UUID, artifact_id: UUID, session: AsyncSession | None = None
    ) -> str | None:
        """Delete a single artifact by id for a user and return its model_url if it existed."""
        # fetch model_url first
        stmt = (
            select(ModelArtifact)
            .where(ModelArtifact.user_id == user_id, ModelArtifact.id == artifact_id)
            .limit(1)
        )
        result = await session.execute(stmt)
        art = result.scalar_one_or_none()
        if not art:
            return None
        model_url = art.model_url
        from sqlalchemy import delete

        del_stmt = delete(ModelArtifact).where(ModelArtifact.id == artifact_id)
        await session.execute(del_stmt)
        return model_url

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

    # --- Metrics trends listing ---
    @connection()
    async def list_training_metrics_trends(
        self,
        user_id: UUID,
        mode: ServiceMode | None = None,
        limit: int = 50,
        session: AsyncSession | None = None,
    ) -> list[tuple[TrainingRun, int]]:
        """Return recent training runs with associated dataset version.

        Output list items are (TrainingRun, dataset_version).
        Optional filtering by dataset mode.
        Ordered by TrainingRun.created_at DESC.
        """
        from sqlalchemy import select

        stmt = (
            select(TrainingRun, Dataset.version)
            .join(Dataset, TrainingRun.dataset_id == Dataset.id)
            .where(TrainingRun.user_id == user_id)
            .order_by(TrainingRun.created_at.desc())
            .limit(limit)
        )
        if mode is not None:
            stmt = stmt.where(Dataset.mode == mode)
        result = await session.execute(stmt)
        return [(row[0], int(row[1])) for row in result.all()]

    # --- Dataset TTL cleanup ---
    @connection()
    async def cleanup_expired_datasets(
        self,
        *,
        cutoff,
        limit: int = 1000,
        session: AsyncSession | None = None,
    ) -> list[str]:
        """Delete datasets older than cutoff and their training runs.

        Returns list of dataset file_keys (Dataset.name) for storage deletion.
        """
        # Select expired dataset IDs and file names
        ds_stmt = (
            select(Dataset.id, Dataset.name)
            .where(Dataset.created_at < cutoff)
            .order_by(Dataset.created_at.asc())
            .limit(limit)
        )
        res = await session.execute(ds_stmt)
        rows = res.fetchall()
        if not rows:
            return []
        ids = [row[0] for row in rows]
        file_keys = [row[1] for row in rows]

        # Delete related training runs
        from sqlalchemy import delete

        del_runs = delete(TrainingRun).where(TrainingRun.dataset_id.in_(ids))
        await session.execute(del_runs)
        # Delete datasets themselves
        del_ds = delete(Dataset).where(Dataset.id.in_(ids))
        await session.execute(del_ds)
        return file_keys
