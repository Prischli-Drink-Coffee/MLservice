"""Внимание: временно отключены роутеры статистики и графов/ML,
так как соответствующие сервисы не завершены. Будут подключены после
реализации согласованных моделей/миграций и сервисов.
"""

import logging
import logging.config

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from service.presentation.handlers.exceptions_handlers import setup_exception_handlers
from service.presentation.routers.auth_api.auth_api import auth_router
from service.presentation.routers.files_api.files_api import files_router
from service.presentation.routers.jobs_api.jobs_api import jobs_router
from service.settings import LOGGING, config
from service.utils.app_lifespan import lifespan

logging.config.dictConfig(LOGGING)
logger = logging.getLogger(__name__)
logger.info(f"config.initialized: {config.model_dump_json(indent=4)}")


def create_app() -> FastAPI:
    app = FastAPI(
        title=config.service_name,
        lifespan=lifespan,
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url="/api/redoc",
    )

    allow_origins = getattr(config, "cors", None)
    allow_origins = getattr(allow_origins, "allow_origins", []) if allow_origins else []
    if allow_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allow_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(auth_router, tags=["Auth-API"])
    app.include_router(jobs_router, tags=["Jobs-API"])
    app.include_router(files_router, tags=["Files-API"])
    # Роутер статистики удалён как легаси (см. backend_audit.md #21)
    from service.presentation.routers.ml_api.ml_api import ml_router

    app.include_router(ml_router, tags=["ML-API"])  # минимальные эндпоинты

    setup_exception_handlers(app)

    @app.get("/api/health", include_in_schema=False)
    async def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()
