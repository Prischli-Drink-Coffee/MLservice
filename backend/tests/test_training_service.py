import types
import uuid

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

    async def get_or_create_dataset_from_file(self, user_id, launch_id, mode, file_name, file_url):
        key = (user_id, file_url)
        ds = self._datasets.get(key)
        if ds is None:
            ds = types.SimpleNamespace(id=uuid.uuid4(), user_id=user_id, file_url=file_url)
            self._datasets[key] = ds
        return ds

    async def create_training_run(self, user_id, launch_id, dataset_id, status):
        run = types.SimpleNamespace(
            id=uuid.uuid4(), user_id=user_id, launch_id=launch_id, status=status
        )
        self._runs[run.id] = run
        return run

    async def create_model_artifact(self, user_id, launch_id, model_url, metrics=None):
        art = types.SimpleNamespace(
            id=uuid.uuid4(),
            user_id=user_id,
            launch_id=launch_id,
            model_url=model_url,
            metrics=metrics,
        )
        self._artifacts[art.id] = art
        return art

    async def update_training_run_status(self, run_id, status, *, model_url=None, metrics=None):
        run = self._runs[run_id]
        run.status = status
        run.model_url = model_url
        run.metrics = metrics
        return run


@pytest.mark.asyncio
async def test_training_service_happy_path_classification(tmp_path):
    user_id = uuid.uuid4()
    job = JobLogic(
        user_id=user_id, mode=ServiceMode.LIPS, type=ServiceType.TRAIN, status=ProcessingStatus.NEW
    )

    datasets_dir = tmp_path / "datasets"
    datasets_dir.mkdir(parents=True, exist_ok=True)
    csv_path = datasets_dir / "sample.csv"
    csv_path.write_text("x1,x2,target\n1,2,0\n2,1,1\n3,4,1\n4,3,0\n")

    fake_file = _FakeFile("sample.csv", "/storage/datasets/sample.csv", created_at=0)
    file_repo = _FakeFileRepo([fake_file])
    train_repo = _FakeTrainingRepo()
    svc = TrainingService(training_repo=train_repo, file_repo=file_repo, storage_root=str(tmp_path))

    metrics = await svc.run_for_job(job)

    assert metrics["task"] == "classification"
    assert "accuracy" in metrics and metrics["accuracy"] >= 0.0
    assert "n_features" in metrics and metrics["n_features"] == 2
    assert "n_samples" in metrics and metrics["n_samples"] == 4
    models_dir = tmp_path / "models"
    assert models_dir.exists() and any(models_dir.iterdir())


@pytest.mark.asyncio
async def test_training_service_happy_path_regression(tmp_path):
    user_id = uuid.uuid4()
    job = JobLogic(
        user_id=user_id, mode=ServiceMode.LIPS, type=ServiceType.TRAIN, status=ProcessingStatus.NEW
    )

    datasets_dir = tmp_path / "datasets"
    datasets_dir.mkdir(parents=True, exist_ok=True)
    csv_path = datasets_dir / "regression.csv"
    rows = ["x1,x2,target"]
    for i in range(30):
        rows.append(f"{i},{i*2},{i * 0.5 + 1}")
    csv_path.write_text("\n".join(rows))

    fake_file = _FakeFile("regression.csv", "/storage/datasets/regression.csv", created_at=1)
    file_repo = _FakeFileRepo([fake_file])
    train_repo = _FakeTrainingRepo()
    svc = TrainingService(training_repo=train_repo, file_repo=file_repo, storage_root=str(tmp_path))

    metrics = await svc.run_for_job(job)

    assert metrics["task"] == "regression"
    assert "r2" in metrics and -1.0 <= metrics["r2"] <= 1.0
    assert "mse" in metrics and metrics["mse"] >= 0.0
    assert metrics["n_features"] == 2
    assert metrics["n_samples"] == 30
    models_dir = tmp_path / "models"
    assert models_dir.exists() and any(models_dir.iterdir())


@pytest.mark.asyncio
async def test_training_service_no_files(tmp_path):
    user_id = uuid.uuid4()
    job = JobLogic(
        user_id=user_id, mode=ServiceMode.LIPS, type=ServiceType.TRAIN, status=ProcessingStatus.NEW
    )
    file_repo = _FakeFileRepo([])
    train_repo = _FakeTrainingRepo()
    svc = TrainingService(training_repo=train_repo, file_repo=file_repo, storage_root=str(tmp_path))

    with pytest.raises(ValueError):
        await svc.run_for_job(job)
