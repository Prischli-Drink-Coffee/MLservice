from enum import StrEnum


class UserTypes(StrEnum):
    REGISTERED = "REGISTERED"


class ServiceMode(StrEnum):
    TRAINING = "TRAINING"


class Languages(StrEnum):
    EN = "EN"
    RU = "RU"


class SessionStatus(StrEnum):
    ACTIVATED = "ACTIVATED"
    WAITING = "WAITING"
    EXPIRED = "EXPIRED"


class ProcessingStatus(StrEnum):
    NEW = "NEW"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"


class BotJobStatus(StrEnum):
    """Статусы для Telegram ботов (Jobs)"""

    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPED = "STOPPED"
    ERROR = "ERROR"
    STARTING = "STARTING"


class ServiceType(StrEnum):
    TRAIN = "TRAIN"  # ML training job type
