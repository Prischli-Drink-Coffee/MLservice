import os
from typing import Literal

import dotenv
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = dotenv.find_dotenv()

LOGGING_LEVEL = os.environ.get("SERVICE_LOGGING_LEVEL", "debug").upper()

LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {
        "default": {"format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"},
    },
    "handlers": {
        "default": {
            "class": "logging.StreamHandler",
            "level": LOGGING_LEVEL,
            "formatter": "default",
        },
    },
    "loggers": {
        "service": {
            "level": LOGGING_LEVEL,
            "handlers": ["default"],
            "propagate": False,
        },
    },
    "root": {"level": LOGGING_LEVEL, "handlers": ["default"]},
}


class Postgresql(BaseModel):
    protocol: str = "postgresql+asyncpg"

    host: str = "localhost"
    port: int = 5432
    user: str | None = "postgres"
    password: str | None = "postgres"
    db: str = "fastbot"

    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_timeout: float = 5.0
    db_pool_recycle: int = 3600  # 1 hour
    db_pool_pre_ping: bool = True
    db_echo: bool = False

    @property
    def dsn(self) -> str:
        return f"{self.protocol}://{self.user}:{self.password}@{self.host}:{self.port}/{self.db}"

    @property
    def dsn_safe(self) -> str:
        return f"{self.protocol}://{self.user}:***@{self.host}:{self.port}/{self.db}"


class AuthConf(BaseModel):
    dev_mode: bool = False
    secret: str = "dev-secret-change-me"
    algorithm: str = "HS256"
    jwt_exp_hours: int = 3600 * 24
    code_exp_hours: int = 5
    debug_mode_code: str = "1111"


class ProfileConf(BaseModel):
    base_available_launches: int = 3


class JobConf(BaseModel):
    wait_time_sec: int = 10
    processing_interval_sec: int = 5
    processing_batch_size: int = 5
    processing_timeout_sec: int = 300


class MLConfig(BaseSettings):
    pass

    # class Config:
    #     env_prefix = "ML_"


class TPOTConfig(BaseSettings):
    """TPOT-specific runtime options read from TPOT__/TPOT_ env vars."""

    parallel_mode: Literal["local", "distributed", "off"] = Field(
        "local",
        env="TPOT_PARALLEL_MODE",
        description="Parallel mode (local/distributed/off) for TPOT-based training",
    )
    n_jobs: int | None = Field(
        None, env="TPOT__N_JOBS", description="Local worker count (if unset, derived dynamically)"
    )
    memory_limit_mb: int | None = Field(
        None, env="TPOT__MEMORY_LIMIT_MB", description="Memory limit passed to TPOT estimators"
    )
    generations: int = Field(
        40, env="TPOT__GENERATIONS", description="Default number of TPOT generations"
    )
    population_size: int = Field(
        64, env="TPOT__POPULATION_SIZE", description="TPOT population size"
    )
    time_left: int = Field(600, env="TPOT__TIME_LEFT", description="Search budget in seconds")
    per_run_limit: int = Field(
        60, env="TPOT__PER_RUN_LIMIT", description="Per-model time budget in seconds"
    )
    metric: str = Field("accuracy", env="TPOT__METRIC", description="Default scoring metric")
    cv_folds: int = Field(5, env="TPOT__CV_FOLDS", description="Cross-validation folds")
    config_dict: str | dict | None = Field(
        None,
        env="TPOT__CONFIG_DICT",
        description=(
            "Reference (module.path.attr) or literal dict for TPOT search space. "
            "Newer TPOT versions prefer search spaces via `tpot.config.get_search_space(name)` or simple "
            "string names like 'linear'/'graph'. For legacy behaviour you can supply a dict or a module.path.attr "
            "that points to a config dict."
        ),
    )
    dask_scheduler_file: str | None = Field(
        "/var/run/tpot/scheduler.json",
        env="TPOT__DASK_SCHEDULER_FILE",
        description="Path to Dask scheduler file used in distributed mode",
    )
    random_state: int = Field(42, env="TPOT__RANDOM_STATE", description="Random state for TPOT")
    leaderboard_topk: int = Field(
        5, env="TPOT__LEADERBOARD_TOPK", description="Leaderboard size to keep in metadata"
    )

    model_config = SettingsConfigDict(
        env_prefix="TPOT__",
        env_nested_delimiter="__",
        case_sensitive=False,
        extra="allow",
        env_file=ENV_FILE,
    )


class CorsConfig(BaseSettings):
    """CORS configuration"""

    allow_origins: list[str] = Field(default_factory=list)
    # Pydantic v2 style config (avoid deprecated inner class Config warning)
    model_config = SettingsConfigDict(env_prefix="CORS_")


class MinioConfig(BaseModel):
    """MinIO/S3 storage configuration"""

    endpoint: str = "minio:9000"
    access_key: str = "minioadmin"
    secret_key: str = "minioadmin"
    bucket: str = "mlops-files"
    region: str = "us-east-1"
    secure: bool = False
    public_endpoint: str = "http://localhost:9000"
    retry_attempts: int = 3
    retry_backoff: float = 0.5
    presign_expiry: int = 3600  # 1 hour default


class RedisConfig(BaseModel):
    """Redis cache/session configuration"""

    enabled: bool = True
    host: str = "redis"
    port: int = 6379
    db: int = 0
    password: str | None = None
    use_ssl: bool = False
    decode_responses: bool = True
    health_check_interval: int = 30

    session_prefix: str = "session"
    session_ttl_seconds: int = 3600

    cache_prefix: str = "cache"
    cache_default_ttl_seconds: int = 300
    profile_cache_ttl_seconds: int = 900

    @property
    def dsn(self) -> str:
        auth = f":{self.password}@" if self.password else ""
        scheme = "rediss" if self.use_ssl else "redis"
        return f"{scheme}://{auth}{self.host}:{self.port}/{self.db}"


class MonitoringConfig(BaseSettings):
    """Prometheus/Grafana monitoring configuration"""

    enabled: bool = True
    metrics_path: str = "/metrics"
    metric_namespace: str = "mlops"
    metric_subsystem: str = "backend"
    latency_buckets: list[float] = Field(  # seconds
        default_factory=lambda: [
            0.005,
            0.01,
            0.025,
            0.05,
            0.1,
            0.25,
            0.5,
            1.0,
            2.0,
            5.0,
            10.0,
        ]
    )

    @field_validator("latency_buckets", mode="before")
    @classmethod
    def _parse_latency_buckets(cls, v):
        # Accept either a proper list or a JSON/string representation from env files.
        if v is None:
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [float(x) for x in parsed]
            except Exception:
                # Fall through and try to parse simple comma-separated list
                try:
                    parts = [p.strip() for p in v.strip("[] ").split(",") if p.strip()]
                    return [float(x) for x in parts]
                except Exception:
                    raise ValueError(
                        "Invalid latency_buckets format; expected JSON list or comma-separated numbers"
                    )
        return v

    gather_default_metrics: bool = True
    instrument_inprogress: bool = True

    model_config = SettingsConfigDict(env_prefix="PROMETHEUS__", env_json=True)


class Config(BaseSettings):
    service_name: str = "service-api"

    auth: AuthConf = AuthConf()
    profile: ProfileConf = ProfileConf()
    pg: Postgresql = Postgresql()
    job: JobConf = JobConf()

    ml: MLConfig = Field(default_factory=MLConfig)
    cors: CorsConfig = Field(default_factory=CorsConfig)
    minio: MinioConfig = Field(default_factory=MinioConfig)
    redis: RedisConfig = Field(default_factory=RedisConfig)
    monitoring: MonitoringConfig = Field(default_factory=MonitoringConfig)

    admin_user_ids: list[str] | str = Field(default_factory=list)

    # Storage backend selection
    storage_backend: str = "local"  # "local" or "minio"

    enable_automl: bool = Field(
        False,
        env="ENABLE_AUTOML",
        description="Master switch for TPOT-powered AutoML training",
    )
    enable_automl_fallback: bool = Field(
        True,
        env="ENABLE_AUTOML_FALLBACK",
        description="Allow fallback to legacy training when TPOT fails",
    )

    # Настройки загрузки файлов (используются files API)
    allowed_extensions: tuple[str, ...] = (".png", ".jpg", ".jpeg", ".csv")
    max_file_size_byte: int = 20 * 1024 * 1024  # 20 MB

    # Dataset TTL automation
    dataset_ttl_days: int = int(os.getenv("DATASET_TTL_DAYS", "0"))  # 0 => disabled
    dataset_ttl_check_interval_sec: int = int(
        os.getenv("DATASET_TTL_CHECK_INTERVAL_SEC", "3600")
    )  # default: hourly
    dataset_ttl_batch_limit: int = int(os.getenv("DATASET_TTL_BATCH_LIMIT", "500"))

    tpot: TPOTConfig = Field(default_factory=TPOTConfig)

    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_nested_delimiter="__",
        extra="ignore",
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
    )

    @field_validator("admin_user_ids", mode="before")
    @classmethod
    def _split_admin_ids(cls, value):  # noqa: D401 - simple converter
        if value is None:
            return []
        if isinstance(value, str):
            return [item.strip().lower() for item in value.split(",") if item.strip()]
        if isinstance(value, (list, tuple, set)):
            return [str(item).strip().lower() for item in value if str(item).strip()]
        return value

    @property
    def admin_user_ids_set(self) -> set[str]:
        return {item.lower() for item in self.admin_user_ids}


def _get_config() -> Config:
    config = Config()
    return config


config = _get_config()
