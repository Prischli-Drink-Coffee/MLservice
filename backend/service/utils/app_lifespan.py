import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from service import container
from service.settings import Config

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting application...")

    try:
        config = Config()
        logger.info("Building dependency container...")
        container.build(config)

        logger.info("Initializing database...")
        pg_connector = container.get(container.PgConnectorName)
        await pg_connector.verify_connection()
        logger.info("Database connection verified")

        logger.info("Starting background task manager...")
        task_manager = container.get(container.BackgroundTaskManagerName)
        await task_manager.start()

        # Запускаем процессор новых задач в фоне
        try:
            job_processor = container.get(container.NewJobProcessorName)
            await task_manager.start_task_with_restart(
                job_processor.process_new_jobs,
                task_name="new-jobs-processor",
                restart_delay=5,
            )
        except Exception:
            logger.warning("Job processor is not available; background processing disabled")

        # Dataset TTL background cleanup
        try:
            if config.dataset_ttl_days > 0:
                from service.services.dataset_ttl_worker import run_dataset_ttl_loop

                training_repo = container.get(container.TrainingRepositoryName)
                file_saver = container.get(container.FileSaverServiceName)

                await task_manager.start_task_with_restart(
                    lambda: run_dataset_ttl_loop(
                        ttl_days_supplier=lambda: config.dataset_ttl_days,
                        interval_sec_supplier=lambda: config.dataset_ttl_check_interval_sec,
                        batch_limit_supplier=lambda: config.dataset_ttl_batch_limit,
                        training_repo=training_repo,
                        file_saver=file_saver,
                    ),
                    task_name="dataset-ttl-cleanup",
                    restart_delay=10,
                )
                logger.info(
                    "Dataset TTL cleanup task started (days=%s, interval=%ss)",
                    config.dataset_ttl_days,
                    config.dataset_ttl_check_interval_sec,
                )
            else:
                logger.info("Dataset TTL cleanup disabled (dataset_ttl_days <= 0)")
        except Exception:
            logger.exception("Failed to start dataset TTL cleanup task")

        logger.info("Application started successfully!")

        yield

    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise

    finally:
        logger.info("Shutting down TeleRAG application...")

        try:
            logger.info("Stopping background task manager...")
            task_manager = container.get(container.BackgroundTaskManagerName)
            await task_manager.stop()

            logger.info("Closing database connections...")
            pg_connector = container.get(container.PgConnectorName)
            await pg_connector.close()
            logger.info("Application shut down gracefully")

        except Exception as e:
            logger.error(f"Error during shutdown: {e}")


async def health_check():
    try:
        pg_connector = container.get(container.PgConnectorName)
        await pg_connector.verify_connection()

        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.0.0",
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "error": str(e), "version": "1.0.0"}
