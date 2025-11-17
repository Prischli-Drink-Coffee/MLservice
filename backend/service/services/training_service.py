import logging
import os
import uuid
from time import perf_counter
from typing import Any
from uuid import UUID

from service.models.jobs_models import JobLogic
from service.models.key_value import ProcessingStatus
from service.monitoring.metrics import (
    record_training_failure,
    record_training_started,
    record_training_success,
)
from service.repositories.file_repository import FileRepository
from service.repositories.training_repository import TrainingRepository

logger = logging.getLogger(__name__)


class TrainingService:
    """Minimal ML training pipeline bound to Jobs.

    For now, it:
    - picks the latest uploaded user file for a given mode
    - creates a Dataset if needed
    - creates a TrainingRun with status PROCESSING
    - simulates training (sleep) and writes a small artifact file
    - saves ModelArtifact and marks TrainingRun SUCCESS
    """

    def __init__(
        self,
        training_repo: TrainingRepository,
        file_repo: FileRepository,
        *,
        storage_root: str | None = None,
    ) -> None:
        self._training_repo = training_repo
        self._file_repo = file_repo
        self._storage_root = storage_root or os.getenv("STORAGE_ROOT", "/var/lib/app/storage")
        # Feature flag to enable real training with pandas/sklearn on safe platforms
        self._enable_real = os.getenv("ENABLE_REAL_TRAINING", "").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

    async def run_for_job(self, job: JobLogic) -> dict[str, Any]:
        """Execute real training flow on a CSV dataset.

        Heuristics:
        - resolve dataset path from stored file_url
        - read CSV with pandas
        - choose task: classification if target is categorical or has few unique values; otherwise regression
        - compute basic metrics and persist model via joblib
        """
        logger.info("Starting training for job %s", job.id)

        record_training_started(job.mode)
        started_at = perf_counter()
        metrics: dict[str, Any] = {}

        payload = job.payload or {}
        target_column = payload.get("target_column")
        if isinstance(target_column, str):
            target_column = target_column.strip() or None
        else:
            target_column = None

        if self._training_repo is None:
            raise RuntimeError("Training repository is not configured")

        dataset_record = None
        dataset_identifier = payload.get("dataset_id")
        if dataset_identifier is not None:
            try:
                dataset_uuid = UUID(str(dataset_identifier))
            except ValueError as exc:  # noqa: BLE001
                raise ValueError("Invalid dataset identifier provided") from exc
            dataset_record = await self._training_repo.get_dataset_by_id(job.user_id, dataset_uuid)
            if dataset_record is None:
                raise ValueError("Dataset not found or access denied")

        # 1) Find latest user file for the job.mode when dataset isn't explicitly selected
        try:
            if dataset_record is None:
                latest_files = await self._file_repo.fetch_user_files_metadata(job.user_id, job.mode)
                if not latest_files:
                    logger.warning("No user files found for user=%s mode=%s", job.user_id, job.mode)
                    raise ValueError("No input dataset available for training")

                user_file = sorted(
                    latest_files, key=lambda f: getattr(f, "created_at", 0), reverse=True
                )[0]

                storage_key = getattr(user_file, "file_name", None) or os.path.basename(
                    getattr(user_file, "file_url", "dataset.csv")
                )
                display_name = os.path.basename(
                    getattr(user_file, "original_name", None) or storage_key
                )

                dataset_record = await self._training_repo.get_or_create_dataset_from_file(
                    user_id=job.user_id,
                    launch_id=job.id,
                    mode=job.mode,
                    display_name=display_name,
                    storage_key=storage_key,
                    file_url=user_file.file_url,
                )

            # 3) Create training run
            if dataset_record is None:
                raise ValueError("Dataset record could not be resolved for training")

            run = await self._training_repo.create_training_run(
                user_id=job.user_id,
                launch_id=job.id,
                dataset_id=dataset_record.id,
                status=ProcessingStatus.PROCESSING,
            )

            # 4) Load dataset and train a simple model
            data_path = self._resolve_data_path(dataset_record.file_url)
            metrics = await self._train_and_export_model(data_path, target_column=target_column)

            # 5) Persist a model artifact file (already created by _train_and_export_model)
            model_url = metrics.get("model_url")
            if not model_url:
                raise ValueError("Training completed but no model_url was generated")

            # 6) Save artifact and mark run done
            await self._training_repo.create_model_artifact(
                user_id=job.user_id,
                launch_id=job.id,
                model_url=model_url,
                metrics=metrics,
            )
            await self._training_repo.update_training_run_status(
                run_id=run.id,
                status=ProcessingStatus.SUCCESS,
                model_url=model_url,
                metrics=metrics,
            )

            # 7) Retention: limit number of artifacts per user (env MAX_MODEL_ARTIFACTS, default 5)
            try:
                max_artifacts = int(os.getenv("MAX_MODEL_ARTIFACTS", "5"))
            except Exception:  # noqa: BLE001
                max_artifacts = 5
            if max_artifacts > 0:
                try:
                    total = await self._training_repo.count_artifacts(job.user_id)
                    if total > max_artifacts:
                        deleted_urls = await self._training_repo.delete_oldest_artifacts(
                            job.user_id, keep=max_artifacts
                        )
                        removed_files = 0
                        for url in deleted_urls:
                            path = self._resolve_model_path(url)
                            try:
                                os.remove(path)
                                removed_files += 1
                            except FileNotFoundError:
                                logger.debug("Retention cleanup skipped missing file: %s", path)
                            except Exception as e:  # noqa: BLE001
                                logger.warning("Failed to delete artifact file %s: %s", path, e)
                        logger.info(
                            "Artifact retention: removed %s DB records and %s files for user %s",
                            len(deleted_urls),
                            removed_files,
                            job.user_id,
                        )
                except Exception:  # noqa: BLE001
                    logger.warning("Artifact retention step failed for user %s", job.user_id)

        except Exception as exc:
            record_training_failure(job.mode, exc)
            raise

        duration = perf_counter() - started_at
        task_label = metrics.get("task") if isinstance(metrics, dict) else None
        record_training_success(job.mode, task_label, duration)

        logger.info("Training for job %s finished successfully", job.id)
        return metrics

    def _resolve_data_path(self, file_url: str) -> str:
        # Map "/storage/..." to storage_root, else treat as absolute or relative under storage_root
        if file_url.startswith("/storage/"):
            rel = file_url[len("/storage/") :]
            return os.path.join(self._storage_root, rel)
        if os.path.isabs(file_url):
            return file_url
        return os.path.join(self._storage_root, file_url)

    async def _train_and_export_model(
        self, csv_path: str, *, target_column: str | None = None
    ) -> dict[str, Any]:
        """Train a simple model on CSV.

        If ENABLE_REAL_TRAINING is set, try pandas/sklearn path; otherwise use lightweight fallback.
        Any failure on heavy path results in fallback.
        """
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Dataset not found: {csv_path}")
        if self._enable_real:
            try:
                import joblib
                import numpy as np
                import pandas as pd
                from sklearn.linear_model import LinearRegression, LogisticRegression
                from sklearn.metrics import (
                    accuracy_score,
                    confusion_matrix,
                    mean_absolute_error,
                    mean_squared_error,
                    precision_recall_fscore_support,
                    r2_score,
                )
                from sklearn.model_selection import train_test_split

                df = pd.read_csv(csv_path)
                if df.empty:
                    raise ValueError("Dataset is empty")

                # Target selection
                target_col = None
                preferred = target_column
                if preferred:
                    if preferred in df.columns:
                        target_col = preferred
                    else:
                        lowered = {col.lower(): col for col in df.columns}
                        match = lowered.get(preferred.lower())
                        if match:
                            target_col = match
                        else:
                            logger.warning(
                                "Target column %s not found in dataset; falling back to heuristic",
                                preferred,
                            )
                if target_col is None:
                    for cand in ["target", "label", "y"]:
                        if cand in df.columns:
                            target_col = cand
                            break
                if target_col is None:
                    target_col = df.columns[-1]

                X = df.drop(columns=[target_col])
                y = df[target_col]

                X = X.select_dtypes(include=[np.number]).copy()
                if X.shape[1] == 0:
                    raise ValueError("No numeric features available for training")

                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.25, random_state=42
                )

                task = "classification"
                if pd.api.types.is_numeric_dtype(y) and y.nunique() > 20:
                    task = "regression"

                if task == "classification":
                    if pd.api.types.is_numeric_dtype(y_train) and y_train.nunique() > 20:
                        median_val = y_train.median()
                        y_train = (y_train > median_val).astype(int)
                        y_test = (y_test > median_val).astype(int)
                    model = LogisticRegression(max_iter=1000, n_jobs=None)
                    model.fit(X_train, y_train)
                    y_pred = model.predict(X_test)
                    acc = accuracy_score(y_test, y_pred)
                    prec, rec, f1, _ = precision_recall_fscore_support(
                        y_test, y_pred, average="macro", zero_division=0
                    )
                    cm = confusion_matrix(y_test, y_pred)
                    metrics: dict[str, Any] = {
                        "task": task,
                        "accuracy": float(acc),
                        "precision": float(prec),
                        "recall": float(rec),
                        "f1": float(f1),
                        "confusion_matrix": cm.tolist(),
                        "n_features": int(X.shape[1]),
                        "n_samples": int(df.shape[0]),
                    }
                else:
                    model = LinearRegression()
                    model.fit(X_train, y_train)
                    y_pred = model.predict(X_test)
                    r2 = r2_score(y_test, y_pred)
                    mse = mean_squared_error(y_test, y_pred)
                    mae = mean_absolute_error(y_test, y_pred)
                    metrics = {
                        "task": task,
                        "r2": float(r2),
                        "mse": float(mse),
                        "mae": float(mae),
                        "n_features": int(X.shape[1]),
                        "n_samples": int(df.shape[0]),
                    }

                model_rel_path = f"models/model_{uuid.uuid4().hex}.joblib"
                model_abs_path = os.path.join(self._storage_root, model_rel_path)
                os.makedirs(os.path.dirname(model_abs_path), exist_ok=True)
                joblib.dump(model, model_abs_path)
                metrics["model_url"] = f"/storage/{model_rel_path}"
                return metrics
            except Exception as e:  # noqa: BLE001
                logger.warning("Heavy training failed or unavailable, falling back: %s", e)
        # fallback
        return await self._train_lightweight(csv_path, target_column=target_column)

    async def _train_lightweight(
        self, csv_path: str, *, target_column: str | None = None
    ) -> dict[str, Any]:
        """Pure-Python fallback: CSV parsing and simple baseline metrics with pickle artifact.

        - Determines target column like primary path
        - Uses only numeric feature columns
        - Classification: majority-class baseline accuracy
        - Regression: mean-baseline with r2=0.0 and computed MSE
        - Exports a tiny pickle artifact
        """
        import csv
        import io
        import pickle

        # Read CSV
        with open(csv_path, "rb") as fh:
            raw = fh.read()
        text_stream = io.TextIOWrapper(
            io.BytesIO(raw), encoding="utf-8", errors="replace", newline=""
        )
        reader = csv.reader(text_stream)
        header = next(reader, None)
        if not header:
            raise ValueError("Dataset has no header")

        # target column selection
        target_idx = None
        preferred = target_column
        if preferred:
            try:
                target_idx = header.index(preferred)
            except ValueError:
                lowered = [col.lower() for col in header]
                if preferred.lower() in lowered:
                    target_idx = lowered.index(preferred.lower())
                else:
                    logger.warning(
                        "Target column %s not found in CSV; falling back to heuristic",
                        preferred,
                    )
        if target_idx is None:
            for cand in ("target", "label", "y"):
                try:
                    target_idx = header.index(cand)
                    break
                except ValueError:
                    continue
        if target_idx is None:
            target_idx = len(header) - 1

        # Collect rows
        rows: list[list[str]] = []
        for row in reader:
            if row and any(str(c).strip() != "" for c in row):
                rows.append(row)
        if not rows:
            raise ValueError("Dataset is empty")

        # Determine numeric feature indices (exclude target)
        feature_indices: list[int] = []
        for i, name in enumerate(header):
            if i == target_idx:
                continue
            # try parse all rows to float; if any fail, skip column
            ok = True
            for r in rows:
                try:
                    float(r[i])
                except Exception:  # noqa: BLE001
                    ok = False
                    break
            if ok:
                feature_indices.append(i)

        if not feature_indices:
            raise ValueError("No numeric features available for training")

        # Extract y values and classification/regression decision
        y_vals: list[str] = [r[target_idx] for r in rows]
        # If all y convertible to float and many unique -> regression, else classification
        y_as_float: list[float] = []
        y_all_float = True
        y_unique: set[str] = set()
        for v in y_vals:
            y_unique.add(v)
            try:
                y_as_float.append(float(v))
            except Exception:  # noqa: BLE001
                y_all_float = False
        task = "classification"
        if y_all_float and len(y_unique) > 20:
            task = "regression"

        n_features = len(feature_indices)
        n_samples = len(rows)

        metrics: dict[str, Any]
        if task == "classification":
            # majority-class accuracy baseline
            counts: dict[str, int] = {}
            for v in y_vals:
                counts[v] = counts.get(v, 0) + 1
            majority = max(counts.values()) if counts else 0
            acc = majority / n_samples if n_samples else 0.0
            metrics = {
                "task": task,
                "accuracy": float(acc),
                # Fallback baseline cannot meaningfully compute precision/recall/f1 for majority classifier
                "precision": None,
                "recall": None,
                "f1": None,
                "n_features": int(n_features),
                "n_samples": int(n_samples),
            }
        else:
            # mean predictor baseline
            mean_y = sum(y_as_float) / n_samples
            sse = sum((yv - mean_y) ** 2 for yv in y_as_float)
            mse = sse / n_samples if n_samples else 0.0
            # r2 vs mean predictor is 0.0 by definition for in-sample baseline
            # MAE for mean predictor baseline equals avg absolute deviation
            mae = sum(abs(yv - mean_y) for yv in y_as_float) / n_samples if n_samples else 0.0
            metrics = {
                "task": task,
                "r2": 0.0,
                "mse": float(mse),
                "mae": float(mae),
                "n_features": int(n_features),
                "n_samples": int(n_samples),
            }

        # Export a tiny pickle model (no heavy deps)
        model_rel_path = f"models/model_{uuid.uuid4().hex}.pkl"
        model_abs_path = os.path.join(self._storage_root, model_rel_path)
        os.makedirs(os.path.dirname(model_abs_path), exist_ok=True)
        dummy_model = {
            "type": "baseline",
            "task": metrics["task"],
            "feature_indices": feature_indices,
            "target_index": target_idx,
        }
        with open(model_abs_path, "wb") as fh:
            pickle.dump(dummy_model, fh)
        metrics["model_url"] = f"/storage/{model_rel_path}"
        return metrics

    def _resolve_model_path(self, model_url: str) -> str:
        """Map stored model_url (which starts with /storage/) to absolute path under storage_root.

        If model_url already absolute, return as is.
        """
        if model_url.startswith("/storage/"):
            rel = model_url[len("/storage/") :]
            return os.path.join(self._storage_root, rel)
        if os.path.isabs(model_url):
            return model_url
        return os.path.join(self._storage_root, model_url)
