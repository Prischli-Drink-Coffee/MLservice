import asyncio
import logging
from typing import NoReturn

from service.models.jobs_models import JobLogic
from service.models.key_value import ProcessingStatus
from service.repositories.job_repository import JobRepository
from service.settings import JobConf

logger = logging.getLogger(__name__)


class NewJobProcessor:
    def __init__(self, config: JobConf, repository: JobRepository, training_runner=None) -> None:
        self.config = config
        self.repository = repository
        # training_runner: Optional[Callable[[JobLogic], Awaitable[dict]]]
        self.training_runner = training_runner

    async def process_new_jobs(self) -> NoReturn:
        while True:
            logger.info("Starting job processing...")
            while new_jobs := await self.repository.fetch_new_jobs(
                limit=self.config.processing_batch_size
            ):
                logger.info(f"Processing {len(new_jobs)} new jobs...")

                processing_tasks = []

                for job in new_jobs:
                    processing_tasks.append(
                        asyncio.create_task(self._process_job_with_timeout(job))
                    )

                await asyncio.gather(*processing_tasks, return_exceptions=True)

            logger.info(
                f"No new jobs found. Waiting before next check: {self.config.processing_interval_sec} seconds."
            )
            await asyncio.sleep(self.config.processing_interval_sec)

    async def _process_job_with_timeout(self, job: JobLogic) -> JobLogic | None:
        try:
            result = await asyncio.wait_for(
                self._process_job(job), timeout=self.config.processing_timeout_sec
            )
            return result
        except asyncio.TimeoutError:
            logger.error(
                f"Job {job.id} timed out after {self.config.processing_timeout_sec} seconds"
            )

            job.status = ProcessingStatus.FAILURE
            await self._save_job_result(job)
            logger.info(f"Marked job {job.id} as FAILURE due to timeout")

            return None

        except Exception as e:
            logger.error(f"Unexpected error processing job {job.id}: {e}", exc_info=True)

            job.status = ProcessingStatus.FAILURE
            await self._save_job_result(job)
            logger.info(f"Marked job {job.id} as FAILURE due to error")

            return None

    async def _process_job(self, job: JobLogic) -> JobLogic:
        logger.info(f"Processing job ID: {job.id}")
        # If ML training service is available, run it and mark job accordingly
        if self.training_runner is not None and getattr(job.type, "name", str(job.type)) == "TRAIN":
            try:
                await self._run_training(job)
                job.status = ProcessingStatus.SUCCESS
            except Exception:
                logger.exception("Training failed for job %s", job.id)
                job.status = ProcessingStatus.FAILURE
        else:
            # Fallback: simple wait to simulate processing
            await asyncio.sleep(self.config.wait_time_sec)
            job.status = ProcessingStatus.SUCCESS

        job = await self._save_job_result(job)
        logger.info(f"Job ID: {job.id} completed with status {job.status}.")
        return job

    async def _run_training(self, job: JobLogic) -> None:
        # Run training via provided runner callable/service
        await self.training_runner(job)

    async def _save_job_result(self, job: JobLogic) -> JobLogic:
        try:
            updated_job = await self.repository.update_job_status(job)
            logger.info(f"Job {job.id} result saved successfully.")
            if updated_job is None:
                raise ValueError("Failed to save job result")
            return updated_job
        except Exception:
            logger.exception(f"Failed to save job {job.id} result.")
            raise Exception("Failed to save job result")
