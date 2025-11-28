"""Encapsulates TPOT training logic and runtime settings."""

from __future__ import annotations

import inspect
import json
import logging
import os
import threading
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Mapping

import pandas as pd
from sklearn.model_selection import train_test_split

from service.services.automl.search_space import build_search_space_config
from service.settings import TPOTConfig

logger = logging.getLogger(__name__)

try:
    from tpot import TPOTClassifier, TPOTRegressor
except ImportError:  # pragma: no cover - guard for missing dependency
    TPOTClassifier = None  # type: ignore[assignment]
    TPOTRegressor = None  # type: ignore[assignment]


@dataclass
class TPOTRunOptions:
    parallel_mode: str
    metric: str
    leaderboard_topk: int
    generations: int
    population_size: int
    time_left: int
    per_run_limit: int
    cv_folds: int
    memory_limit_mb: int | None
    n_jobs: int
    config_dict: Any
    dask_scheduler_file: str | None
    dask_address: str | None
    random_state: int
    verbosity: int


@dataclass
class TPOTResult:
    fitted_pipeline: Any
    evaluated_individuals: pd.DataFrame
    best_score: float | None
    metric_name: str
    generations_completed: int
    population_size: int
    parallel_mode: str


class TPOTTrainer:
    def __init__(self, config: TPOTConfig):
        self._config = config

    def _default_n_jobs(self) -> int:
        if self._config.n_jobs and self._config.n_jobs > 0:
            return self._config.n_jobs
        cpu_count = (os.cpu_count() or 2) - 1
        cpu_count = min(cpu_count, 8)
        return max(1, cpu_count)

    def resolve_run_options(self, payload: dict[str, Any] | None) -> TPOTRunOptions:
        payload = payload or {}
        return TPOTRunOptions(
            parallel_mode=payload.get("parallel_mode") or self._config.parallel_mode,
            metric=payload.get("metric") or self._config.metric,
            leaderboard_topk=payload.get("leaderboard_topk") or self._config.leaderboard_topk,
            generations=payload.get("generations") or self._config.generations,
            population_size=payload.get("population_size") or self._config.population_size,
            time_left=payload.get("time_left") or self._config.time_left,
            per_run_limit=payload.get("per_run_limit") or self._config.per_run_limit,
            cv_folds=payload.get("cv_folds") or self._config.cv_folds,
            memory_limit_mb=payload.get("memory_limit_mb") or self._config.memory_limit_mb,
            n_jobs=int(payload.get("n_jobs") or self._default_n_jobs()),
            config_dict=(
                payload.get("config_dict") if "config_dict" in payload else self._config.config_dict
            ),
            dask_scheduler_file=payload.get("dask_scheduler_file")
            or self._config.dask_scheduler_file,
            dask_address=payload.get("dask_address") or None,
            random_state=payload.get("random_state") or self._config.random_state,
            verbosity=payload.get("verbosity") or 1,
        )

    def _build_estimator(
        self, task: str, options: TPOTRunOptions, dask_client: Any | None = None
    ) -> Any:
        # Prepare a set of candidate kwargs; we'll prune them depending on
        # which ones the installed TPOT estimator class actually accepts.
        desired_kwargs: dict[str, Any] = {
            "generations": options.generations,
            "population_size": options.population_size,
            "cv": options.cv_folds,
            "scoring": options.metric,
            "max_time_mins": round(options.time_left / 60, 2) if options.time_left else None,
            "max_eval_time_mins": (
                round(options.per_run_limit / 60, 2) if options.per_run_limit else None
            ),
            "memory_limit": options.memory_limit_mb,
            "random_state": options.random_state,
            "verbosity": options.verbosity,
        }

        # Build TPOT search space / config. If the user provided a legacy
        # `config_dict` attempt to convert it into a TPOT SearchSpace object
        # (validated via .generate()). If conversion succeeds, pass as
        # `search_space` (preferred by newer TPOT). Otherwise fall back to
        # passing a raw `config_dict` mapping for older TPOT versions.
        if options.config_dict is not None and isinstance(options.config_dict, Mapping):
            _space = build_search_space_config(task, override=options.config_dict)
            if isinstance(_space, Mapping):
                # Conversion failed/returned a raw dict — use TPOT's default
                # search space instead of passing a bare dict which would
                # later cause TPOT to call .generate() on a dict.
                default_space = build_search_space_config(task, override=None)
                desired_kwargs["search_space"] = default_space
            else:
                desired_kwargs["search_space"] = _space
        else:
            # No explicit config dict provided; resolve defaults/convert when
            # appropriate. The helper may return a mapping (legacy) or a
            # TPOT SearchSpace / string name.
            _space = build_search_space_config(task, override=options.config_dict)
            if isinstance(_space, Mapping):
                default_space = build_search_space_config(task, override=None)
                desired_kwargs["search_space"] = default_space
            else:
                desired_kwargs["search_space"] = _space

        if dask_client is not None:
            # prefer to pass explicit client if supported by TPOT. TPOT expects
            # a `client` kwarg (not `dask_client`), so pass it under that name
            # to avoid TPOT creating a LocalCluster of its own.
            desired_kwargs["client"] = dask_client
            # when providing a client, ensure TPOT does not try to spawn
            # multiple internal workers via n_jobs
            desired_kwargs["n_jobs"] = 1
        else:
            desired_kwargs["n_jobs"] = options.n_jobs

        # Helper to prune/match kwargs against estimator signature
        def _filter_kwargs(est_cls, candidates: dict[str, Any]) -> dict[str, Any]:
            try:
                sig = inspect.signature(est_cls.__init__)
                params = set(sig.parameters.keys())
                # detect **kwargs support
                has_varkw = any(
                    p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values()
                )
            except Exception:
                params = set()
                has_varkw = False
            # If this is the real TPOT estimator (module startswith 'tpot') and
            # it exposes **kwargs, passing arbitrary kwargs can still blow up
            # because TPOT forwards them to internal classes. In that case
            # restrict to a safe whitelist of known TPOT constructor args.
            is_tpot_impl = getattr(est_cls, "__module__", "").startswith("tpot")
            if has_varkw and is_tpot_impl:
                allowed_keys = {
                    "generations",
                    "population_size",
                    "cv",
                    "max_time_mins",
                    "max_eval_time_mins",
                    "memory_limit",
                    "random_state",
                    "n_jobs",
                    # do not blindly allow config_dict; handle mapping below
                    "search_space",
                    "verbose",
                    "verbosity",
                }
            else:
                allowed_keys = None
            out: dict[str, Any] = {}
            for k, v in candidates.items():
                # Special-case config dict: map to 'search_space' or 'config_dict'
                # depending on what the estimator accepts. Do this before the
                # generic allowed_keys handling so we don't skip it. If the
                # estimator accepts **kwargs, allow passing the legacy
                # `config_dict` through so downstream shims or tests that rely
                # on it continue to work.
                if k == "config_dict":
                    if "config_dict" in params:
                        out["config_dict"] = v
                        continue
                    if "search_space" in params:
                        out["search_space"] = v
                        continue
                    if has_varkw:
                        out["config_dict"] = v
                        continue
                    # otherwise skip passing config_dict
                    continue
                if has_varkw and allowed_keys is None:
                    # class accepts **kwargs and is not TPOT core; allow all
                    out[k] = v
                    continue
                if k in params:
                    out[k] = v
                    continue
                if has_varkw and allowed_keys is not None and k in allowed_keys:
                    # map common aliases when allowing keys for TPOT impl
                    if k == "verbosity" and "verbose" in params:
                        out["verbose"] = v
                        continue
                    if k == "scoring":
                        for alt in ("scoring", "scoring_function", "fitness_function", "fitness"):
                            if alt in params:
                                out[alt] = v
                                break
                        else:
                            pass
                        if any(
                            alt in params
                            for alt in (
                                "scoring",
                                "scoring_function",
                                "fitness_function",
                                "fitness",
                            )
                        ):
                            continue
                    # map config_dict -> search_space when appropriate
                    if k == "config_dict":
                        if "config_dict" in params:
                            out["config_dict"] = v
                            continue
                        if "search_space" in params:
                            out["search_space"] = v
                            continue
                        # otherwise do not pass config_dict into TPOT impl
                        continue
                    out[k] = v
                    continue
                # common aliases
                if k == "verbosity" and "verbose" in params:
                    out["verbose"] = v
                    continue
                if k == "scoring":
                    for alt in ("scoring", "scoring_function", "fitness_function", "fitness"):
                        if alt in params:
                            out[alt] = v
                            break
                    continue
                # ignore unsupported kwargs
            return out

        if task.lower() == "regression":
            if TPOTRegressor is None:
                raise RuntimeError("TPOTRegressor is unavailable")
            # TPOT warns if both `generations` and `max_time_mins` are provided.
            # Prefer a time budget if it was explicitly set (options.time_left),
            # otherwise keep generations. Remove the redundant key to avoid
            # TPOT's warning and potential ambiguity.
            if desired_kwargs.get("max_time_mins") and desired_kwargs.get("generations"):
                logger.info(
                    "Both max_time_mins and generations set; preferring time limit and removing generations to avoid TPOT warning"
                )
                desired_kwargs.pop("generations", None)
            ctor_kwargs = _filter_kwargs(TPOTRegressor, desired_kwargs)
            return TPOTRegressor(**ctor_kwargs)

        if TPOTClassifier is None:
            raise RuntimeError("TPOTClassifier is unavailable")
        if desired_kwargs.get("max_time_mins") and desired_kwargs.get("generations"):
            logger.info(
                "Both max_time_mins and generations set; preferring time limit and removing generations to avoid TPOT warning"
            )
            desired_kwargs.pop("generations", None)
        ctor_kwargs = _filter_kwargs(TPOTClassifier, desired_kwargs)
        return TPOTClassifier(**ctor_kwargs)

    def _maybe_create_dask_client(self, options: TPOTRunOptions) -> Any | None:
        if options.parallel_mode != "distributed":
            return None
        try:
            from dask.distributed import Client
        except ImportError as exc:  # pragma: no cover - optional dependency
            logger.warning("dask.distributed not installed: %s", exc)
            return None
        # Prefer connecting by address if provided, otherwise fall back to
        # scheduler_file mechanism.
        if options.dask_address:
            try:
                c = Client(options.dask_address)
                # TPOT sometimes expects client.cluster.workers to exist (this
                # is the case when TPOT was written assuming a LocalCluster).
                # Remote clients may not set client.cluster; attach a lightweight
                # cluster-like object with a `workers` mapping so TPOT's checks
                # succeed (we keep using the real client for submits).
                try:
                    if getattr(c, "cluster", None) is None:
                        info = c.scheduler_info()
                        workers = info.get("workers", {})

                        class _ClusterLike:
                            def __init__(self, workers):
                                # minimal cluster-like shape expected by some dask
                                # client internals and by TPOT: a `workers` mapping
                                # and a `status` attribute.
                                self.workers = workers
                                self.status = None

                        c.cluster = _ClusterLike(workers)
                except Exception:
                    # best-effort only
                    pass
                # Best-effort: ensure worker environments can import
                # commonly required packages (pkg_resources) and make the
                # local `service` package available to workers by uploading
                # its source files. This reduces "different environments"
                # deserialization errors during TPOT distributed runs.
                try:
                    # Try to import pkg_resources on workers; if it fails
                    # the client.run will raise and we'll log a helpful
                    # warning below instead of failing hard.
                    try:
                        c.run(lambda: __import__("pkg_resources"))
                    except Exception:
                        logger.warning(
                            "One or more Dask workers cannot import pkg_resources; consider installing setuptools in the worker image"
                        )

                    # Upload our local `service` package files if present
                    # so workers can import the project modules used by
                    # TPOT tasks. This is best-effort and safe to skip if
                    # the `service` package isn't importable locally.
                    try:
                        import os as _os

                        import service as _svc

                        pkg_dir = _os.path.dirname(_svc.__file__)
                        # Walk the package and upload .py files
                        for _root, _dirs, _files in __import__("os").walk(pkg_dir):
                            for _f in _files:
                                if _f.endswith(".py"):
                                    _p = _os.path.join(_root, _f)
                                    try:
                                        c.upload_file(_p)
                                    except Exception:
                                        # best-effort only
                                        logger.debug(
                                            "Failed uploading %s to workers", _p, exc_info=True
                                        )
                    except Exception:
                        # If we can't find or upload the package, continue
                        logger.debug(
                            "Could not upload local 'service' package to workers (best-effort)",
                            exc_info=True,
                        )
                except Exception:
                    # Don't fail connecting the client if these checks fail;
                    # they are best-effort diagnostics/hardening.
                    logger.debug("Post-connect worker checks/upload failed", exc_info=True)
                return c
            except Exception as exc:
                logger.warning(
                    "Failed to connect to Dask scheduler address %s: %s", options.dask_address, exc
                )
                return None
        if not options.dask_scheduler_file:
            logger.warning("Distributed mode selected but no scheduler file or address configured")
            return None
        try:
            c = Client(scheduler_file=options.dask_scheduler_file)
            try:
                if getattr(c, "cluster", None) is None:
                    info = c.scheduler_info()
                    workers = info.get("workers", {})

                    class _ClusterLike:
                        def __init__(self, workers):
                            self.workers = workers

                    c.cluster = _ClusterLike(workers)
            except Exception:
                pass
            return c
        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Failed to connect to Dask scheduler %s: %s", options.dask_scheduler_file, exc
            )
            return None

    def train(
        self,
        dataframe: pd.DataFrame,
        target_column: str,
        task: str,
        payload: dict[str, Any] | None = None,
    ) -> TPOTResult:
        options = self.resolve_run_options(payload)
        client = self._maybe_create_dask_client(options)
        # If we have a distributed client, sanity-check worker memory limits
        # before launching TPOT. In previous runs the trainer would proceed
        # even when workers registered with extremely small memory_limit
        # (e.g. 1.00 kiB) which caused immediate nanny restarts and opaque
        # TPOT failures. Detect that early and fail fast with a helpful
        # message so callers (and smoke scripts) can adjust compose/args.
        if client is not None:
            try:
                info = client.scheduler_info()
                workers = info.get("workers", {})
                if not workers:
                    raise RuntimeError("Connected to Dask scheduler but no workers are registered")
                # compute memory limits (bytes) and detect suspiciously small values
                mem_limits = {w: data.get("memory_limit") for w, data in workers.items()}
                # if any worker reports a memory_limit smaller than 10 MB, abort
                tiny = {
                    w: m for w, m in mem_limits.items() if m is not None and m < 10 * 1024 * 1024
                }
                if tiny:
                    raise RuntimeError(
                        "Dask cluster workers have insufficient memory_limit (bytes): %s" % tiny
                    )
            except Exception:
                # If any inspection fails we close the client and surface the
                # exception further down where the caller will see it. This
                # avoids silently continuing with a misconfigured cluster.
                if client is not None:
                    try:
                        client.close()
                    except Exception:
                        pass
                raise
        try:
            estimator = self._build_estimator(task, options, dask_client=client)
            X = dataframe.drop(columns=[target_column], errors="ignore")
            X = X.select_dtypes(include=["number"]).copy()
            y = dataframe[target_column].copy()
            if X.empty:
                raise ValueError("No numeric features available for TPOT training")
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.25, random_state=options.random_state
            )
            # If we have a distributed client, snapshot the scheduler/workers
            # right before running TPOT so we can diagnose transient worker
            # registrations and memory_limit anomalies seen in CI runs.
            if client is not None:
                try:
                    snapshot = client.scheduler_info()
                    try:
                        with open("/tmp/dask_scheduler_info_pre_fit.json", "w") as fh:
                            json.dump(snapshot, fh, default=str)
                    except Exception:
                        logger.debug("Failed to write scheduler_info snapshot", exc_info=True)
                except Exception:
                    logger.debug("Failed to collect scheduler_info before fit", exc_info=True)

                # Start a background thread to poll scheduler_info frequently
                # and record worker registration events. This helps capture
                # transient workers that register briefly during TPOT execution.
                stop_event = threading.Event()

                def _poll_scheduler():
                    last_seen = set()
                    try:
                        with open("/tmp/dask_worker_events.log", "a") as fh:
                            fh.write(f"=== poll start {datetime.utcnow().isoformat()}Z ===\n")
                    except Exception:
                        pass
                    while not stop_event.is_set():
                        try:
                            info = client.scheduler_info()
                            workers = info.get("workers", {})
                            current = set(workers.keys())
                            added = current - last_seen
                            removed = last_seen - current
                            if added or removed:
                                ts = datetime.utcnow().isoformat() + "Z"
                                try:
                                    with open("/tmp/dask_worker_events.log", "a") as fh:
                                        fh.write(
                                            f"{ts} added={list(added)} removed={list(removed)} full={list(current)}\n"
                                        )
                                except Exception:
                                    pass
                            last_seen = current
                        except Exception:
                            try:
                                with open("/tmp/dask_worker_events.log", "a") as fh:
                                    fh.write(f"{datetime.utcnow().isoformat()}Z poll_error\n")
                            except Exception:
                                pass
                        time.sleep(0.25)

                poll_thread = threading.Thread(target=_poll_scheduler, daemon=True)
                poll_thread.start()

            # If a Dask client was passed, try to enforce joblib backend
            # or environment hints so TPOT doesn't spawn local workers.
            # This is best-effort and guarded so it won't fail if joblib-dask
            # is not available.
            backend_cm = None
            try:
                if client is not None:
                    # hint to TPOT (non-standard env flag, best-effort)
                    os.environ.setdefault("TPOT_DISABLE_LOCAL_WORKERS", "1")
                    try:
                        from joblib import parallel_backend

                        # Prefer the dask backend if available so TPOT uses
                        # the provided client rather than spawning local workers.
                        try:
                            backend_cm = parallel_backend(
                                "dask", scheduler_host=client.scheduler.address
                            )
                        except Exception:
                            # fallback: use loky as a safe backend
                            backend_cm = parallel_backend("loky")
                    except Exception:
                        # joblib not available or backend not installed; ignore
                        logger.debug("joblib backend forcing not available", exc_info=True)
            except Exception:
                logger.debug("Failed applying joblib backend hints", exc_info=True)

            try:
                if backend_cm is not None:
                    with backend_cm:
                        estimator.fit(X_train, y_train)
                else:
                    estimator.fit(X_train, y_train)
            except Exception as exc:
                # On error, attempt to capture scheduler state to /tmp for post-mortem
                if client is not None:
                    try:
                        snapshot = client.scheduler_info()
                        with open("/tmp/dask_scheduler_info_on_exception.json", "w") as fh:
                            json.dump(snapshot, fh, default=str)
                    except Exception:
                        logger.debug("Failed to write scheduler_info on exception", exc_info=True)
                raise
            finally:
                # stop background poller and join
                try:
                    if client is not None:
                        stop_event.set()
                        poll_thread.join(timeout=2.0)
                except Exception:
                    pass

            # If a Dask client was passed, try to enforce joblib backend
            # or environment hints so TPOT doesn't spawn local workers.
            # This is best-effort and guarded so it won't fail if joblib-dask
            # is not available.
            try:
                if client is not None:
                    # hint to TPOT (non-standard env flag, best-effort)
                    os.environ.setdefault("TPOT_DISABLE_LOCAL_WORKERS", "1")
                    try:
                        from joblib import parallel_backend

                        # Prefer the dask backend if available so TPOT uses
                        # the provided client rather than spawning local workers.
                        try:
                            parallel_backend("dask", scheduler_host=client.scheduler.address)
                        except Exception:
                            # fallback: set loky as a safe backend
                            parallel_backend("loky")
                    except Exception:
                        # joblib not available or backend not installed; ignore
                        logger.debug("joblib backend forcing not available", exc_info=True)
            except Exception:
                logger.debug("Failed applying joblib backend hints", exc_info=True)
            try:
                # TPOT's estimator may not implement a .score method in all
                # versions; prefer using sklearn's scorer lookup which is a
                # stable way to evaluate the fitted estimator with the
                # configured metric name. Fall back to a simple accuracy
                # scorer when lookup fails.
                try:
                    from sklearn.metrics import get_scorer

                    scorer = get_scorer(options.metric)
                    best_score = float(scorer(estimator, X_test, y_test))
                except Exception:
                    # Fallback: try calling estimator.score if present,
                    # otherwise compute accuracy manually.
                    if hasattr(estimator, "score"):
                        best_score = float(estimator.score(X_test, y_test))
                    else:
                        from sklearn.metrics import accuracy_score

                        preds = getattr(estimator, "predict", lambda x: None)(X_test)
                        if preds is None:
                            # Give up and set NaN so callers see missing value
                            best_score = float("nan")
                        else:
                            best_score = float(accuracy_score(y_test, preds))
            except Exception:
                # If scoring raised unexpectedly, set NaN but continue to
                # return other diagnostic fields to the caller.
                logger.debug("Failed to compute best_score", exc_info=True)
                best_score = float("nan")
            # Avoid evaluating DataFrame truthiness (which raises). Check sequentially.
            evaluated = getattr(estimator, "evaluated_individuals_", None)
            if evaluated is None:
                evaluated = getattr(estimator, "evaluated_individuals", None)
            if evaluated is None:
                evaluated = pd.DataFrame()
            generations_completed = getattr(
                estimator, "generations_completed_", options.generations
            )
            return TPOTResult(
                fitted_pipeline=estimator.fitted_pipeline_,
                evaluated_individuals=evaluated,
                best_score=best_score,
                metric_name=options.metric,
                generations_completed=generations_completed,
                population_size=options.population_size,
                parallel_mode=options.parallel_mode,
            )
        finally:
            if client is not None:
                client.close()
