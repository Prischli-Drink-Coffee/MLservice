import logging
from uuid import UUID

from fastapi import HTTPException, status

from service.models.jobs_models import JobLogic
from service.models.key_value import ProcessingStatus, ServiceType
from service.models.profile_models import UserProfileLogic
from service.presentation.routers.jobs_api.schemas import JobResponse, StartJobRequest
from service.repositories.job_repository import JobRepository
from service.repositories.training_repository import TrainingRepository
from service.services.profile_service import ProfileService
from service.settings import JobConf

logger = logging.getLogger(__name__)


class JobService:
    def __init__(
        self,
        config: JobConf,
        repository: JobRepository,
        profile_source: ProfileService,
        training_repo: TrainingRepository | None = None,
    ) -> None:
        self.config = config
        self.repository = repository
        self.profile_source = profile_source
        self.training_repo = training_repo

    async def create_job(self, user_id: UUID, request_body: StartJobRequest) -> JobResponse:
        logger.info(
            f"Creating job for user: {user_id} with params: {request_body.mode=}, {request_body.type}"
        )

        user_attempts = await self._fetch_user_attempts(user_id)
        if user_attempts <= 0:
            logger.error(f"No available launches for user: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No available launches",
            )

        user_ongoing_jobs = await self.repository.fetch_jobs_by_user_id(
            user_id, [ProcessingStatus.NEW, ProcessingStatus.PROCESSING]
        )
        if user_ongoing_jobs:
            logger.error(f"User: {user_id} has an ongoing job")
            logger.debug(
                f"Ongoing jobs: {[j.model_dump_json(indent=2) for j in user_ongoing_jobs]}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has an ongoing job. Please wait for it to complete before starting a new one.",
            )

        payload: dict[str, str] = {}
        dataset_id = request_body.dataset_id or request_body.file_id
        if dataset_id:
            if self.training_repo is None:
                logger.error("Training repository is unavailable for dataset validation")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Training repository unavailable",
                )
            dataset = await self.training_repo.get_dataset_by_id(user_id, dataset_id)
            if not dataset:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Dataset not found or access denied",
                )
            payload["dataset_id"] = str(dataset.id)
        if request_body.target_column:
            payload["target_column"] = request_body.target_column.strip()

        new_job = JobLogic(
            user_id=user_id,
            mode=request_body.mode,
            type=request_body.type,
            status=ProcessingStatus.NEW,
            payload=payload or None,
        )
        created_job = await self.repository.create_job(new_job)

        logger.info(f"Job created with ID: {created_job.id} for user: {user_id}")

        # TRAIN jobs предполагают ML обучение: период ожидания может быть выше
        wait_time = self.config.wait_time_sec
        if created_job.type.name == "TRAIN":
            wait_time = max(wait_time, self.config.processing_timeout_sec)

        return JobResponse(
            job_id=created_job.id,
            status=created_job.status,
            result_file_url=None,
            available_launches=user_attempts - 1,
            wait_time_sec=wait_time,
            model_url=None,
            metrics=None,
        )

    async def fetch_job_result(self, user_id: UUID, job_id: UUID) -> JobResponse:
        logger.info(f"Fetching job result for job: {job_id} and user: {user_id}")

        job = await self.repository.fetch_job_by_id(job_id, user_id)

        if not job:
            logger.error(f"Job not found for user: {user_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        if job.status == ProcessingStatus.SUCCESS and job.is_payment_taken is False:
            logger.info(f"Job {job.id} completed successfully, processing payment")
            job = await self._take_payment(job)

        user_attempts = await self._fetch_user_attempts(user_id)

        # Enrich TRAIN job with model_url + metrics if available
        model_url = None
        metrics = None
        if job.type == ServiceType.TRAIN:
            try:
                from service.repositories.training_repository import (
                    TrainingRepository,  # local import
                )

                training_repo = self.repository.connector  # PgConnector via JobRepository -> reuse
                # Instantiate a lightweight TrainingRepository to fetch enrichment data
                tr_repo = TrainingRepository(training_repo)
                run = await tr_repo.get_training_run_by_launch(job.user_id, job.id)
                art = await tr_repo.get_model_artifact_by_launch(job.user_id, job.id)
                if run and run.model_url:
                    model_url = run.model_url
                    metrics = run.metrics or (art.metrics if art else None)
                elif art:
                    model_url = art.model_url
                    metrics = art.metrics
            except Exception:  # noqa: BLE001
                logger.warning("Failed to enrich TRAIN job with metrics")

        return JobResponse(
            job_id=job.id,
            status=job.status,
            result_file_url=None,
            available_launches=user_attempts,
            wait_time_sec=self.config.wait_time_sec,
            model_url=model_url,
            metrics=metrics,
        )

    async def _take_payment(self, job: JobLogic) -> JobLogic:

        await self.profile_source.decrement_available_launches(job.user_id)

        updated_job = await self.repository.update_job_status(job)
        if not updated_job:
            logger.error(f"Failed to update job payment status for job: {job.id}")
            raise ValueError("Failed to update job payment status")

        logger.info(f"Payment processed for job: {job.id}")
        return updated_job

    async def _fetch_user_attempts(self, user_id: UUID) -> int:
        user_profile = await self._fetch_user(user_id)
        return user_profile.available_launches

    async def _fetch_user(self, user_id: UUID) -> UserProfileLogic:
        try:
            user_profile = await self.profile_source.fetch_user_profile(user_id)
        except ValueError:
            logger.exception(f"User profile not found or inactive for user: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found or inactive",
            )

        logger.debug(f"User {user_id} has: {user_profile.available_launches} available launches")
        return user_profile
