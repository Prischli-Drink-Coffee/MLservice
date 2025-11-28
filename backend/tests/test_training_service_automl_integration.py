import os
import types
import uuid
from datetime import datetime

import joblib
import pandas as pd
import pytest

from service.models.jobs_models import JobLogic
from service.models.key_value import ProcessingStatus, ServiceMode, ServiceType
from service.services.training_service import TrainingService


class _FakeFile:
    def __init__(self, name: str, url: str, created_at):
        self.file_name = name
        self.file_url = url
        self.created_at = created_at


class _FakeFileRepo:
    def __init__(self, files):
        self._files = files

    async def fetch_user_files_metadata(self, user_id, mode):
        return self._files


class _FakeTrainingRepo:
    def __init__(self):
        self._datasets = {}
        self._runs = {}
        self._artifacts = {}

    async def get_or_create_dataset_from_file(self, user_id, launch_id, mode, *, display_name, storage_key, file_url):
        key = (user_id, file_url)
        ds = self._datasets.get(key)
        if ds is None:
            ds = types.SimpleNamespace(
                id=uuid.uuid4(),
                user_id=user_id,
                file_url=file_url,
                name=display_name,
                storage_key=storage_key,
            )
            self._datasets[key] = ds
        return ds

    async def create_training_run(self, user_id, launch_id, dataset_id, status):
        run = types.SimpleNamespace(id=uuid.uuid4(), user_id=user_id, launch_id=launch_id, status=status)
        self._runs[run.id] = run
        return run

    async def create_model_artifact(self, user_id, launch_id, model_url, metrics=None):
        art = types.SimpleNamespace(id=uuid.uuid4(), user_id=user_id, launch_id=launch_id, model_url=model_url, metrics=metrics)
        self._artifacts[art.id] = art
        return art

    async def update_training_run_status(self, run_id, status, *, model_url=None, metrics=None):
        run = self._runs[run_id]
        run.status = status
        run.model_url = model_url
        run.metrics = metrics
        return run


class FakeTPOTResult:
    def __init__(self):
        self.fitted_pipeline = "fake_pipeline_obj"
        self.evaluated_individuals = pd.DataFrame([{"Individual": 1, "Generation": 0}])
        self.best_score = 0.9
        self.metric_name = "accuracy"
        self.generations_completed = 1
        self.population_size = 2
        self.parallel_mode = "local"


class FakeTPOTTrainer:
    def __init__(self):
        self.last_payload = None

    def resolve_run_options(self, payload):
        # minimal object used by TrainingService
        return types.SimpleNamespace(metric="accuracy", leaderboard_topk=5, generations=1, population_size=2, time_left=60, per_run_limit=30, cv_folds=3, memory_limit_mb=None, n_jobs=1, config_dict=None, dask_scheduler_file=None, random_state=42)

    def train(self, dataframe, target_column, task, payload=None):
        self.last_payload = payload
        # return a result object with expected attributes
        res = FakeTPOTResult()
        # TPOTTrainer.train returns attributes named fitted_pipeline_ and evaluated_individuals_
        # but TrainingService expects fitted_pipeline and evaluated_individuals attributes in result (we adapted earlier),
        # use both to be safe
        res.fitted_pipeline_ = res.fitted_pipeline
        res.evaluated_individuals_ = res.evaluated_individuals
        return res


@pytest.mark.asyncio
async def test_training_service_uses_automl_and_writes_artifacts(tmp_path, monkeypatch):
    user_id = uuid.uuid4()
    job = JobLogic(user_id=user_id, mode=ServiceMode.TRAINING, type=ServiceType.TRAIN, status=ProcessingStatus.NEW)

    # create small CSV
    datasets_dir = tmp_path / "datasets"
    datasets_dir.mkdir(parents=True, exist_ok=True)
    csv_path = datasets_dir / "sample.csv"
    csv_path.write_text("x1,x2,target\n1,2,0\n2,1,1\n3,4,1\n4,3,0\n")

    fake_file = _FakeFile("sample.csv", "/storage/datasets/sample.csv", created_at=0)
    file_repo = _FakeFileRepo([fake_file])
    train_repo = _FakeTrainingRepo()

    # instantiate service with automl enabled and fake trainer
    trainer = FakeTPOTTrainer()
    svc = TrainingService(training_repo=train_repo, file_repo=file_repo, storage_root=str(tmp_path), automl_enabled=True, automl_fallback=False, tpot_trainer=trainer)

    metrics = await svc.run_for_job(job)

    assert metrics["task"] == "classification"
    assert "model_url" in metrics
    # check files exist
    model_rel = metrics["model_url"].replace('/storage/', '')
    leaderboard_rel = metrics["leaderboard_url"].replace('/storage/', '')
    pareto_rel = metrics["pareto_front_url"].replace('/storage/', '')
    assert (tmp_path / model_rel).exists()
    assert (tmp_path / leaderboard_rel).exists()
    assert (tmp_path / pareto_rel).exists()

    # check leaderboard content
    import json
    lb = json.loads((tmp_path / leaderboard_rel).read_text())
    assert isinstance(lb, list) or isinstance(lb, dict)
