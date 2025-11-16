"""Setup helpers for Prometheus metrics exposition."""

from __future__ import annotations

import logging
from typing import Iterable

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator, metrics

from service.settings import config

logger = logging.getLogger(__name__)

_instrumentator: Instrumentator | None = None


def _normalize_buckets(raw: Iterable[float] | None) -> tuple[float, ...]:
    if not raw:
        return (
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
        )
    try:
        buckets = tuple(sorted({float(v) for v in raw if float(v) > 0.0}))
    except Exception:  # noqa: BLE001
        logger.warning("Invalid latency buckets provided, using defaults")
        return _normalize_buckets(None)
    return buckets if buckets else _normalize_buckets(None)


def setup_monitoring(app: FastAPI) -> None:
    """Attach Prometheus metrics handlers to the FastAPI application."""

    global _instrumentator

    monitoring_cfg = getattr(config, "monitoring", None)
    if not monitoring_cfg or not monitoring_cfg.enabled:
        logger.info("Prometheus monitoring disabled via configuration")
        return

    if _instrumentator is not None:
        logger.debug("Prometheus instrumentator already configured")
        return

    latency_buckets = _normalize_buckets(getattr(monitoring_cfg, "latency_buckets", None))

    instrumentator = Instrumentator(
        should_instrument_requests_inprogress=monitoring_cfg.instrument_inprogress,
        excluded_handlers=[monitoring_cfg.metrics_path],
    )

    instrumentator.add(metrics.requests(
        should_include_method=True,
        should_include_handler=True,
        should_include_status=True,
    ))
    instrumentator.add(metrics.latency(buckets=latency_buckets))
    instrumentator.add(metrics.response_size())
    instrumentator.add(metrics.request_size())
    if monitoring_cfg.instrument_inprogress:
        logger.info("Instrument-in-progress metric ignored because the helper is unavailable in this version")

    instrumentator.instrument(app)
    instrumentator.expose(
        app,
        endpoint=monitoring_cfg.metrics_path,
        include_in_schema=False,
        should_gzip=True,
    )

    _instrumentator = instrumentator

    logger.info(
        "Prometheus metrics exposed at %s (namespace=%s, subsystem=%s)",
        monitoring_cfg.metrics_path,
        monitoring_cfg.metric_namespace,
        monitoring_cfg.metric_subsystem,
    )


def get_instrumentator() -> Instrumentator | None:
    """Return the current instrumentator instance (if initialized)."""

    return _instrumentator
