import logging
import os
import uuid
from typing import Any

from service.models.jobs_models import JobLogic
from service.models.key_value import ProcessingStatus
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

        # 1) Find latest user file for the job.mode
        latest_files = await self._file_repo.fetch_user_files_metadata(job.user_id, job.mode)
        if not latest_files:
            logger.warning("No user files found for user=%s mode=%s", job.user_id, job.mode)
            raise ValueError("No input dataset available for training")

        user_file = sorted(latest_files, key=lambda f: getattr(f, "created_at", 0), reverse=True)[0]

        # 2) Ensure dataset exists (registry record)
        dataset = await self._training_repo.get_or_create_dataset_from_file(
            user_id=job.user_id,
            launch_id=job.id,
            mode=job.mode,
            file_name=user_file.file_name,
            file_url=user_file.file_url,
        )

        # 3) Create training run
        run = await self._training_repo.create_training_run(
            user_id=job.user_id,
            launch_id=job.id,
            dataset_id=dataset.id,
            status=ProcessingStatus.PROCESSING,
        )

        # 4) Load dataset and train a simple model
        data_path = self._resolve_data_path(user_file.file_url)
        metrics: dict[str, Any] = await self._train_and_export_model(data_path)

        # 5) Persist a model artifact file (already created by _train_and_export_model)
        model_url = metrics.pop("model_url")

        # 6) Save artifact and mark run done
        await self._training_repo.create_model_artifact(
            user_id=job.user_id,
            launch_id=job.id,
            model_url=model_url,
            metrics=metrics,
        )
        await self._training_repo.update_training_run_status(
            run_id=run.id, status=ProcessingStatus.SUCCESS, model_url=model_url, metrics=metrics
        )

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

    async def _train_and_export_model(self, csv_path: str) -> dict[str, Any]:
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
                from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
                from sklearn.model_selection import train_test_split

                df = pd.read_csv(csv_path)
                if df.empty:
                    raise ValueError("Dataset is empty")

                # Target selection
                target_col = None
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
                    metrics: dict[str, Any] = {
                        "task": task,
                        "accuracy": float(acc),
                        "n_features": int(X.shape[1]),
                        "n_samples": int(df.shape[0]),
                    }
                else:
                    model = LinearRegression()
                    model.fit(X_train, y_train)
                    y_pred = model.predict(X_test)
                    r2 = r2_score(y_test, y_pred)
                    mse = mean_squared_error(y_test, y_pred)
                    metrics = {
                        "task": task,
                        "r2": float(r2),
                        "mse": float(mse),
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
        return await self._train_lightweight(csv_path)

    async def _train_lightweight(self, csv_path: str) -> dict[str, Any]:
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
        for cand in ("target", "label", "y"):
            try:
                idx = header.index(cand)
                target_idx = idx
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
                "n_features": int(n_features),
                "n_samples": int(n_samples),
            }
        else:
            # mean predictor baseline
            mean_y = sum(y_as_float) / n_samples
            sse = sum((yv - mean_y) ** 2 for yv in y_as_float)
            mse = sse / n_samples if n_samples else 0.0
            # r2 vs mean predictor is 0.0 by definition for in-sample baseline
            metrics = {
                "task": task,
                "r2": 0.0,
                "mse": float(mse),
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
