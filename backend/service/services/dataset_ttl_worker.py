import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Callable

from service.repositories.training_repository import TrainingRepository
from service.services.file_saver_service import FileSaverService

logger = logging.getLogger(__name__)


async def run_dataset_ttl_loop(
    *,
    ttl_days_supplier: Callable[[], int],
    interval_sec_supplier: Callable[[], int],
    batch_limit_supplier: Callable[[], int],
    training_repo: TrainingRepository,
    file_saver: FileSaverService,
):
    """Periodic loop to cleanup expired datasets and remove files.

    Suppliers are used to read up-to-date config values on each iteration.
    """
    while True:
        ttl_days = max(0, int(ttl_days_supplier() or 0))
        interval_sec = max(5, int(interval_sec_supplier() or 3600))
        batch_limit = max(1, int(batch_limit_supplier() or 500))

        if ttl_days <= 0:
            logger.debug("Dataset TTL disabled (ttl_days <= 0). Sleeping %s sec", interval_sec)
            await asyncio.sleep(interval_sec)
            continue

        try:
            cutoff = datetime.now(timezone.utc) - timedelta(days=ttl_days)
            logger.info(
                "Running dataset TTL cleanup: cutoff=%s, batch_limit=%s",
                cutoff.isoformat(),
                batch_limit,
            )

            file_keys = await training_repo.cleanup_expired_datasets(
                cutoff=cutoff, limit=batch_limit
            )
            files_removed = 0
            files_missing = 0
            for key in file_keys:
                try:
                    await file_saver.storage.delete_file(file_key=key)
                    files_removed += 1
                except FileNotFoundError:
                    files_missing += 1
                except Exception:
                    logger.exception("Failed to delete file during TTL cleanup: %s", key)

            if file_keys:
                logger.info(
                    "Dataset TTL cleanup cycle: datasets=%d, files_removed=%d, files_missing=%d",
                    len(file_keys),
                    files_removed,
                    files_missing,
                )
            else:
                logger.debug("Dataset TTL cleanup: no expired datasets found")

        except Exception:
            logger.exception("Dataset TTL cleanup cycle failed")

        await asyncio.sleep(interval_sec)
