import uuid

import pytest

from service.models.jobs_models import JobLogic
from service.models.key_value import ProcessingStatus, ServiceMode, ServiceType
from service.services.training_service import TrainingService


class _FakeFile:
    def __init__(self, name: str, url: str, created_at: int):
        self.file_name = name
        self.file_url = url
        self.created_at = created_at


class _FakeFileRepo:
    def __init__(self, files):
        self._files = files

    async def fetch_user_files_metadata(self, user_id, mode):  # pragma: no cover - simple
        return self._files


class _FakeTrainingRepo:
    def __init__(self):
        self._datasets = {}
        self._runs = {}
        self._artifacts = []  # list of model_url
        self._created_urls = []

    async def get_or_create_dataset_from_file(self, user_id, launch_id, mode, file_name, file_url):
        key = (user_id, file_url)
        ds = self._datasets.get(key)
        if ds is None:
            ds = type("DS", (), {"id": uuid.uuid4(), "user_id": user_id, "file_url": file_url})()
            self._datasets[key] = ds
        return ds

    async def create_training_run(self, user_id, launch_id, dataset_id, status):
        run = type(
            "Run",
            (),
            {
                "id": uuid.uuid4(),
                "user_id": user_id,
                "launch_id": launch_id,
                "status": status,
            },
        )()
        self._runs[run.id] = run
        return run

    async def create_model_artifact(self, user_id, launch_id, model_url, metrics=None):
        self._artifacts.append(model_url)
        self._created_urls.append(model_url)
        return type("Art", (), {"id": uuid.uuid4(), "model_url": model_url})()

    async def update_training_run_status(self, run_id, status, *, model_url=None, metrics=None):
        run = self._runs[run_id]
        run.status = status
        run.model_url = model_url
        run.metrics = metrics
        return run

    async def count_artifacts(self, user_id):
        return len(self._artifacts)

    async def delete_oldest_artifacts(self, user_id, keep):
        # simulate deletion: drop oldest beyond keep
        if len(self._artifacts) <= keep:
            return []
        removed = self._artifacts[:-keep]
        self._artifacts = self._artifacts[-keep:]
        return removed


@pytest.mark.asyncio
async def test_training_service_retention_file_cleanup(tmp_path, monkeypatch):
    # Prepare CSV files for multiple runs so artifacts exceed MAX_MODEL_ARTIFACTS
    storage_root = tmp_path
    datasets_dir = storage_root / "datasets"
    datasets_dir.mkdir(parents=True, exist_ok=True)

    # Create one CSV used repeatedly
    csv_path = datasets_dir / "data.csv"
    csv_path.write_text("x1,x2,target\n1,2,0\n2,1,1\n")

    user_id = uuid.uuid4()
    job_base = {
        "user_id": user_id,
        "mode": ServiceMode.LIPS,
        "type": ServiceType.TRAIN,
        "status": ProcessingStatus.NEW,
    }

    # Fake repository & file repo (returns same file each time)
    fake_file = _FakeFile("data.csv", "/storage/datasets/data.csv", created_at=0)
    file_repo = _FakeFileRepo([fake_file])
    train_repo = _FakeTrainingRepo()

    monkeypatch.setenv("MAX_MODEL_ARTIFACTS", "2")  # keep only 2 latest

    svc = TrainingService(training_repo=train_repo, file_repo=file_repo, storage_root=str(storage_root))

    created_paths = []
    # Run 4 training jobs to create 4 artifacts
    for i in range(4):
        job = JobLogic(**job_base)
        await svc.run_for_job(job)
        # read last created url from repo
        model_url = train_repo._created_urls[-1]
        # Resolve absolute path and record
        rel = model_url.replace("/storage/", "")
        abs_path = storage_root / rel
        assert abs_path.exists()
        created_paths.append(abs_path)

    # After retention with keep=2 only last 2 should remain
    remaining = [p for p in created_paths if p.exists()]
    assert len(remaining) == 2, f"Expected 2 remaining files, got {len(remaining)}"
    # Sanity: ensure they are the most recently created (suffix order in list)
    assert remaining[0] == created_paths[-2] and remaining[1] == created_paths[-1]
