import os

import dotenv
from pydantic import BaseModel, Field
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


class CorsConfig(BaseSettings):
    """CORS configuration"""

    allow_origins: list[str] = Field(default_factory=list)

    class Config:
        env_prefix = "CORS_"


class Config(BaseSettings):
    service_name: str = "service-api"

    auth: AuthConf = AuthConf()
    profile: ProfileConf = ProfileConf()
    pg: Postgresql = Postgresql()
    job: JobConf = JobConf()

    ml: MLConfig = Field(default_factory=MLConfig)
    cors: CorsConfig = Field(default_factory=CorsConfig)

    # Настройки загрузки файлов (используются files API)
    allowed_extensions: tuple[str, ...] = (".png", ".jpg", ".jpeg", ".csv")
    max_file_size_byte: int = 20 * 1024 * 1024  # 20 MB

    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_nested_delimiter="__",
        extra="ignore",
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
    )


def _get_config() -> Config:
    config = Config()
    return config


config = _get_config()
