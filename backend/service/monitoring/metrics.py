"""Prometheus metric helpers for the ML Ops backend."""

from __future__ import annotations

from typing import Any

from prometheus_client import Counter, Histogram

from service.settings import config

_monitoring_cfg = getattr(config, "monitoring", None)
_MONITORING_ENABLED = bool(_monitoring_cfg and _monitoring_cfg.enabled)

_namespace = "mlops"
_subsystem = "backend"
if _monitoring_cfg:
    namespace = (_monitoring_cfg.metric_namespace or "mlops").strip().lower()
    subsystem = (_monitoring_cfg.metric_subsystem or "backend").strip().lower()
    if namespace:
        _namespace = namespace
    if subsystem:
        _subsystem = subsystem

_prefix = f"{_namespace}_{_subsystem}"

if _MONITORING_ENABLED:
    DATASET_UPLOADS_TOTAL = Counter(
        f"{_prefix}_dataset_uploads_total",
        "Number of datasets uploaded by users",
        labelnames=("mode",),
    )
    DATASET_UPLOAD_SIZE_BYTES = Histogram(
        f"{_prefix}_dataset_upload_size_bytes",
        "Distribution of dataset upload sizes in bytes",
        labelnames=("mode",),
        buckets=(
            10_000,
            50_000,
            100_000,
            250_000,
            500_000,
            1_000_000,
            2_000_000,
            5_000_000,
            10_000_000,
            20_000_000,
        ),
    )
    TRAINING_RUNS_TOTAL = Counter(
        f"{_prefix}_training_runs_total",
        "Training runs grouped by mode and outcome",
        labelnames=("mode", "outcome", "task"),
    )
    TRAINING_FAILURES_TOTAL = Counter(
        f"{_prefix}_training_failures_total",
        "Training failures grouped by error type",
        labelnames=("mode", "error_type"),
    )
    TRAINING_DURATION_SECONDS = Histogram(
        f"{_prefix}_training_duration_seconds",
        "Training execution time in seconds",
        labelnames=("mode", "task"),
        buckets=(
            0.5,
            1.0,
            2.0,
            5.0,
            10.0,
            20.0,
            40.0,
            60.0,
            120.0,
            300.0,
        ),
    )
    DATASET_TTL_CYCLES_TOTAL = Counter(
        f"{_prefix}_dataset_ttl_cycles_total",
        "Dataset TTL cleanup loop cycles",
        labelnames=("result",),
    )
    DATASET_TTL_DATASETS_REMOVED_TOTAL = Counter(
        f"{_prefix}_dataset_ttl_datasets_removed_total",
        "Datasets removed by TTL cleanup",
    )
    DATASET_TTL_FILES_REMOVED_TOTAL = Counter(
        f"{_prefix}_dataset_ttl_files_removed_total",
        "Files removed by TTL cleanup",
    )
    DATASET_TTL_FILES_MISSING_TOTAL = Counter(
        f"{_prefix}_dataset_ttl_files_missing_total",
        "Files missing during TTL cleanup",
    )
else:
    DATASET_UPLOADS_TOTAL = None
    DATASET_UPLOAD_SIZE_BYTES = None
    TRAINING_RUNS_TOTAL = None
    TRAINING_FAILURES_TOTAL = None
    TRAINING_DURATION_SECONDS = None
    DATASET_TTL_CYCLES_TOTAL = None
    DATASET_TTL_DATASETS_REMOVED_TOTAL = None
    DATASET_TTL_FILES_REMOVED_TOTAL = None
    DATASET_TTL_FILES_MISSING_TOTAL = None


def is_enabled() -> bool:
    """Determine whether monitoring counters are active."""

    return _MONITORING_ENABLED


def _mode_label(mode: Any) -> str:
    value = getattr(mode, "value", mode)
    if value is None:
        return "unknown"
    return str(value).lower()


def _task_label(task: Any | None) -> str:
    if task in {None, "", "none"}:
        return "unknown"
    value = getattr(task, "value", task)
    return str(value).lower()


def record_dataset_upload(mode: Any, size_bytes: int) -> None:
    if not _MONITORING_ENABLED:
        return
    safe_size = max(0, int(size_bytes or 0))
    label = _mode_label(mode)
    DATASET_UPLOADS_TOTAL.labels(mode=label).inc()
    DATASET_UPLOAD_SIZE_BYTES.labels(mode=label).observe(safe_size)


def record_training_started(mode: Any) -> None:
    if not _MONITORING_ENABLED:
        return
    label = _mode_label(mode)
    TRAINING_RUNS_TOTAL.labels(mode=label, outcome="started", task="unknown").inc()


def record_training_success(mode: Any, task: Any | None, duration_seconds: float) -> None:
    if not _MONITORING_ENABLED:
        return
    label = _mode_label(mode)
    task_label = _task_label(task)
    TRAINING_RUNS_TOTAL.labels(mode=label, outcome="success", task=task_label).inc()
    TRAINING_DURATION_SECONDS.labels(mode=label, task=task_label).observe(
        max(0.0, float(duration_seconds))
    )


def record_training_failure(mode: Any, error: BaseException) -> None:
    if not _MONITORING_ENABLED:
        return
    label = _mode_label(mode)
    error_type = type(error).__name__ if isinstance(error, BaseException) else str(error)
    TRAINING_RUNS_TOTAL.labels(mode=label, outcome="failure", task="unknown").inc()
    TRAINING_FAILURES_TOTAL.labels(mode=label, error_type=error_type).inc()


def record_dataset_ttl_success(
    datasets_removed: int,
    files_removed: int,
    files_missing: int,
) -> None:
    if not _MONITORING_ENABLED:
        return
    DATASET_TTL_CYCLES_TOTAL.labels(result="success").inc()
    if datasets_removed > 0:
        DATASET_TTL_DATASETS_REMOVED_TOTAL.inc(datasets_removed)
    if files_removed > 0:
        DATASET_TTL_FILES_REMOVED_TOTAL.inc(files_removed)
    if files_missing > 0:
        DATASET_TTL_FILES_MISSING_TOTAL.inc(files_missing)


def record_dataset_ttl_empty() -> None:
    if not _MONITORING_ENABLED:
        return
    DATASET_TTL_CYCLES_TOTAL.labels(result="empty").inc()


def record_dataset_ttl_failure() -> None:
    if not _MONITORING_ENABLED:
        return
    DATASET_TTL_CYCLES_TOTAL.labels(result="failure").inc()
