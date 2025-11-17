import logging
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from service.models.db.db_models import UserLaunch
from service.models.jobs_models import JobLogic
from service.models.key_value import ProcessingStatus
from service.repositories.base_repository import BaseRepository
from service.repositories.decorators.session_processor import connection

logger = logging.getLogger(__name__)


class JobRepository(BaseRepository):

    @connection()
    async def create_job(self, job: JobLogic, session: AsyncSession | None = None) -> JobLogic:
        logger.debug(f"Creating job: {job}")

        new_job = UserLaunch(
            user_id=job.user_id,
            mode=job.mode,
            type=job.type,
            status=job.status,
            is_payment_taken=job.is_payment_taken,
            payload=job.payload,
        )

        session.add(new_job)
        await session.flush()
        return JobLogic.model_validate(new_job)

    @connection()
    async def fetch_job_by_id(
        self, job_id: UUID, user_id: UUID, session: AsyncSession | None = None
    ) -> JobLogic | None:
        logger.debug(f"Fetching job by id: {job_id} for user: {user_id}")

        stmt = select(UserLaunch).where(UserLaunch.id == job_id, UserLaunch.user_id == user_id)
        result = await session.execute(stmt)

        if db_job := result.scalar_one_or_none():
            job = JobLogic.model_validate(db_job)
        else:
            job = None

        return job

    @connection()
    async def fetch_jobs_by_user_id(
        self,
        user_id: UUID,
        statuses: list[ProcessingStatus],
        session: AsyncSession | None = None,
    ) -> list[JobLogic]:
        logger.debug(f"Fetching jobs for user: {user_id}")

        stmt = select(UserLaunch).where(
            UserLaunch.user_id == user_id, UserLaunch.status.in_(statuses)
        )
        result = await session.execute(stmt)
        db_jobs = result.scalars().all()

        jobs = [JobLogic.model_validate(job) for job in db_jobs]
        return jobs

    @connection()
    async def update_job_status(
        self, job: JobLogic, session: AsyncSession | None = None
    ) -> JobLogic | None:
        logger.debug(f"Updating job status: {job.id}")

        updating_job = UserLaunch(
            id=job.id,
            user_id=job.user_id,
            mode=job.mode,
            type=job.type,
            status=job.status,
            is_payment_taken=job.is_payment_taken,
            created_at=job.created_at,
            updated_at=job.updated_at,
            payload=job.payload,
        )

        await session.merge(updating_job)
        await session.flush()

        return JobLogic.model_validate(updating_job)

    @connection()
    async def fetch_new_jobs(
        self, limit: int = 10, session: AsyncSession | None = None
    ) -> list[JobLogic]:
        logger.debug(f"Fetching {limit} new jobs")

        stmt = (
            select(UserLaunch)
            .where(UserLaunch.status == ProcessingStatus.NEW)
            .limit(limit)
            .with_for_update(skip_locked=True)
        )
        result = await session.execute(stmt)
        db_jobs = result.scalars().all()

        if not db_jobs:
            logger.debug("No new jobs found")
            return []

        job_ids = [job.id for job in db_jobs]
        update_stmt = (
            update(UserLaunch)
            .where(UserLaunch.id.in_(job_ids))
            .values(status=ProcessingStatus.PROCESSING)
        )
        await session.execute(update_stmt)
        await session.flush()

        updated_stmt = select(UserLaunch).where(UserLaunch.id.in_(job_ids))
        updated_result = await session.execute(updated_stmt)
        updated_jobs = updated_result.scalars().all()

        jobs = [JobLogic.model_validate(job) for job in updated_jobs]
        logger.debug(f"Fetched: {len(jobs)} jobs")
        return jobs
