import logging

from service.infrastructure.database.postgresql import PgConnector
from service.repositories.auth_repository import AuthRepository
from service.repositories.file_repository import FileRepository
from service.repositories.job_repository import JobRepository
from service.repositories.profile_repository import ProfileRepository
from service.services.auth_service import AuthService
from service.services.automl.tpot_trainer import TPOTTrainer
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

    redis_cache = None
    redis_session_store = None

    if getattr(config, "redis", None) and config.redis.enabled:
        try:
            from service.infrastructure.cache.redis_cache import RedisCacheService
            from service.infrastructure.cache.redis_manager import RedisManager
            from service.infrastructure.cache.redis_session_store import RedisSessionStore

            redis_manager = RedisManager(config.redis)
            redis_client = redis_manager.get_client()

            _CONTAINER[RedisManagerName] = redis_manager
            _CONTAINER[RedisClientName] = redis_client

            redis_cache = RedisCacheService(redis_client, config.redis)
            redis_session_store = RedisSessionStore(redis_client, config.redis)

            _CONTAINER[RedisCacheServiceName] = redis_cache
            _CONTAINER[RedisSessionStoreName] = redis_session_store

            logger.info("Initialized Redis cache and session backends")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to initialize Redis backend: %s", exc)
    else:
        logger.info("Redis backend disabled via configuration")

    # Repositories
    _CONTAINER[AuthRepositoryName] = AuthRepository(
        get(PgConnectorName), session_store=redis_session_store
    )
    _CONTAINER[JobRepositoryName] = JobRepository(get(PgConnectorName))
    _CONTAINER[ProfileRepositoryName] = ProfileRepository(get(PgConnectorName))
    _CONTAINER[FileRepositoryName] = FileRepository(get(PgConnectorName))
    training_repo = None
    try:
        from service.repositories.training_repository import TrainingRepository

        training_repo = TrainingRepository(get(PgConnectorName))
        _CONTAINER[TrainingRepositoryName] = training_repo
    except Exception:  # noqa: BLE001
        logger.warning("TrainingRepository not available; training features will be limited")

    # Services
    _CONTAINER[ProfileServiceName] = ProfileService(
        config.profile,
        get(ProfileRepositoryName),
        cache=redis_cache,
        cache_ttl_seconds=(
            config.redis.profile_cache_ttl_seconds if redis_cache and config.redis else None
        ),
    )
    _CONTAINER[AuthServiceName] = AuthService(
        config.auth,
        get(AuthRepositoryName),
        get(ProfileServiceName),
    )
    _CONTAINER[JobServiceName] = JobService(
        config.job,
        get(JobRepositoryName),
        get(ProfileServiceName),
        training_repo=training_repo,
    )
    # Storage backend selection
    backend = config.storage_backend.strip().lower()
    try:
        if backend == "minio":
            from service.infrastructure.storage.minio_file_storage import MinioFileStorage

            storage = MinioFileStorage(config.minio)
            logger.info("Initialized MinIO storage backend")
        else:
            from service.infrastructure.storage.local_file_storage import LocalFileStorage

            storage = LocalFileStorage()
            logger.info("Initialized Local storage backend")
    except Exception as e:  # noqa: BLE001
        logger.warning(
            "Failed to initialize %s storage backend, falling back to local: %s", backend, e
        )
        from service.infrastructure.storage.local_file_storage import LocalFileStorage

        storage = LocalFileStorage()
        logger.info("Fallback: Using Local storage backend")

    _CONTAINER[FileSaverServiceName] = FileSaverService(
        repository=get(FileRepositoryName),
        folder_name="uploads",
        file_storage=storage,
    )
    # Training service (ML pipeline v1)
    _CONTAINER[TrainingServiceName] = TrainingService(
        training_repo=training_repo,
        file_repo=get(FileRepositoryName),
        automl_enabled=config.enable_automl,
        automl_fallback=config.enable_automl_fallback,
        tpot_trainer=TPOTTrainer(config.tpot),
    )

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


FileSaverServiceT = FileSaverService
FileSaverServiceName = "FileSaverService"
TrainingServiceT = TrainingService
TrainingServiceName = "TrainingService"

# Repository names
AuthRepositoryName = "AuthRepository"
JobRepositoryName = "JobRepository"
ProfileRepositoryName = "ProfileRepository"
FileRepositoryName = "FileRepository"
TrainingRepositoryName = "TrainingRepository"

# Processor names and types
NewJobProcessorT = NewJobProcessor
NewJobProcessorName = "NewJobProcessor"

# Utils names
BackgroundTaskManagerT = BackgroundTaskManager
BackgroundTaskManagerName = "BackgroundTaskManager"
PgConnectorName = "PgConnector"

# Redis related names
RedisManagerName = "RedisManager"
RedisClientName = "RedisClient"
RedisCacheServiceName = "RedisCacheService"
RedisSessionStoreName = "RedisSessionStore"

_CONTAINER = {}
