import logging

from service.infrastructure.database.postgresql import PgConnector
from service.repositories.auth_repository import AuthRepository
from service.repositories.file_repository import FileRepository
from service.repositories.job_repository import JobRepository
from service.repositories.profile_repository import ProfileRepository
from service.services.auth_service import AuthService
from service.services.file_saver_service import FileSaverService
from service.services.job_processor import NewJobProcessor
from service.services.job_service import JobService
from service.services.profile_service import ProfileService
from service.services.training_service import TrainingService
from service.settings import Config
from service.utils.background_task_manager import BackgroundTaskManager

logger = logging.getLogger(__name__)


def build(config: Config):
    _CONTAINER.clear()
    _CONTAINER[BackgroundTaskManagerName] = BackgroundTaskManager()
    _CONTAINER[PgConnectorName] = PgConnector(config.pg)

    # Repositories
    _CONTAINER[AuthRepositoryName] = AuthRepository(get(PgConnectorName))
    _CONTAINER[JobRepositoryName] = JobRepository(get(PgConnectorName))
    _CONTAINER[ProfileRepositoryName] = ProfileRepository(get(PgConnectorName))
    _CONTAINER[FileRepositoryName] = FileRepository(get(PgConnectorName))

    # Services
    _CONTAINER[ProfileServiceName] = ProfileService(config.profile, get(ProfileRepositoryName))
    _CONTAINER[AuthServiceName] = AuthService(
        config.auth,
        get(AuthRepositoryName),
        get(ProfileServiceName),
    )
    _CONTAINER[JobServiceName] = JobService(
        config.job,
        get(JobRepositoryName),
        get(ProfileServiceName),
    )
    # Storage backend selection
    try:
        import os as _os

        backend = _os.getenv("STORAGE_BACKEND", "local").strip().lower()
        if backend == "minio":
            from service.infrastructure.storage.minio_file_storage import MinioFileStorage

            storage = MinioFileStorage()
        else:
            from service.infrastructure.storage.local_file_storage import LocalFileStorage

            storage = LocalFileStorage()
    except Exception as e:  # noqa: BLE001
        logger.warning(
            "Failed to initialize configured storage backend, falling back to local: %s", e
        )
        from service.infrastructure.storage.local_file_storage import LocalFileStorage

        storage = LocalFileStorage()

    _CONTAINER[FileSaverServiceName] = FileSaverService(
        repository=get(FileRepositoryName),
        folder_name="uploads",
        file_storage=storage,
    )
    # Training service (ML pipeline v1)
    _CONTAINER[TrainingServiceName] = TrainingService(
        training_repo=None,  # will be set via DI names below if needed
        file_repo=get(FileRepositoryName),
    )

    # Переинициализируем TrainingService c TrainingRepository при наличии
    try:
        from service.repositories.training_repository import TrainingRepository

        _CONTAINER[TrainingRepositoryName] = TrainingRepository(get(PgConnectorName))
        _CONTAINER[TrainingServiceName] = TrainingService(
            training_repo=get(TrainingRepositoryName),
            file_repo=get(FileRepositoryName),
        )
    except Exception:
        logger.warning("TrainingRepository not available; training service will be limited")

    _CONTAINER[NewJobProcessorName] = NewJobProcessor(
        config.job,
        get(JobRepositoryName),
        training_runner=get(TrainingServiceName).run_for_job,
    )


def getter(name: str):
    return lambda: get(name)


def get(name: str):
    if name not in _CONTAINER:
        raise ValueError(f"Dependency not found: {name}")
    return _CONTAINER[name]


# Service names and types
AuthServiceT = AuthService
AuthServiceName = "AuthService"

JobServiceT = JobService
JobServiceName = "JobService"

ProfileServiceT = ProfileService
ProfileServiceName = "ProfileService"

MLServiceT = None  # placeholder
MLServiceName = "MLService"

StatsServiceT = None  # placeholder
StatsServiceName = "StatsService"

FileStorageServiceT = None  # placeholder до реализации
FileStorageServiceName = "FileStorageService"

FileSaverServiceT = FileSaverService
FileSaverServiceName = "FileSaverService"
TrainingServiceT = TrainingService
TrainingServiceName = "TrainingService"

# Repository names
AuthRepositoryName = "AuthRepository"
JobRepositoryName = "JobRepository"
ProfileRepositoryName = "ProfileRepository"
MLRepositoryName = "MLRepository"  # placeholder
StatsRepositoryName = "StatsRepository"  # placeholder
FileRepositoryName = "FileRepository"
TrainingRepositoryName = "TrainingRepository"

# Processor names and types
NewJobProcessorT = NewJobProcessor
NewJobProcessorName = "NewJobProcessor"

# Utils names
BackgroundTaskManagerT = BackgroundTaskManager
BackgroundTaskManagerName = "BackgroundTaskManager"
PgConnectorName = "PgConnector"

_CONTAINER = {}
