import os
import sys
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

    async def fetch_user_files_metadata(self, user_id, mode):  # pragma: no cover - trivial
        return self._files


class _FakeTrainingRepo:
    def __init__(self):
        self._datasets = {}
        self._runs = {}
        self._arts = []

    async def get_or_create_dataset_from_file(
        self, user_id, launch_id, mode, *, display_name, storage_key, file_url
    ):
        key = (user_id, file_url)
        ds = self._datasets.get(key)
        if ds is None:
            ds = type(
                'DS',
                (),
                {
                    'id': uuid.uuid4(),
                    'user_id': user_id,
                    'file_url': file_url,
                    'name': display_name,
                    'storage_key': storage_key,
                },
            )()
            self._datasets[key] = ds
        return ds

    async def create_training_run(self, user_id, launch_id, dataset_id, status):
        run = type('Run', (), {'id': uuid.uuid4(), 'user_id': user_id, 'launch_id': launch_id, 'status': status})()
        self._runs[run.id] = run
        return run

    async def create_model_artifact(self, user_id, launch_id, model_url, metrics=None):
        art = type('Art', (), {'id': uuid.uuid4(), 'model_url': model_url, 'metrics': metrics})()
        self._arts.append(art)
        return art

    async def update_training_run_status(self, run_id, status, *, model_url=None, metrics=None):
        run = self._runs[run_id]
        run.status = status
        run.model_url = model_url
        run.metrics = metrics
        return run


@pytest.mark.skipif(sys.platform.startswith('win'), reason='Heavy training disabled / unstable on Windows imports')
def test_heavy_training_joblib_artifact(tmp_path, monkeypatch):
    # Only run when ENABLE_REAL_TRAINING is enabled
    if not os.getenv('ENABLE_REAL_TRAINING'):
        pytest.skip('ENABLE_REAL_TRAINING not set')

    user_id = uuid.uuid4()
    job = JobLogic(
        user_id=user_id,
        mode=ServiceMode.TRAINING,
        type=ServiceType.TRAIN,
        status=ProcessingStatus.NEW,
    )

    datasets_dir = tmp_path / 'datasets'
    datasets_dir.mkdir(parents=True, exist_ok=True)
    csv_path = datasets_dir / 'heavy.csv'
    # Ensure >20 unique numeric targets to trigger regression branch as additional coverage
    rows = ['f1,f2,target'] + [f"{i},{i*2},{i*1.5}" for i in range(30)]
    csv_path.write_text('\n'.join(rows))

    fake_file = _FakeFile('heavy.csv', '/storage/datasets/heavy.csv', created_at=0)
    file_repo = _FakeFileRepo([fake_file])
    train_repo = _FakeTrainingRepo()
    monkeypatch.setenv('ENABLE_REAL_TRAINING', '1')
    svc = TrainingService(training_repo=train_repo, file_repo=file_repo, storage_root=str(tmp_path))

    import asyncio
    metrics = asyncio.get_event_loop().run_until_complete(svc.run_for_job(job))

    # Should have produced joblib artifact when heavy path succeeded
    model_url = metrics.get('model_url')
    assert model_url and model_url.endswith('.joblib')
    rel = model_url.replace('/storage/', '')
    assert (tmp_path / rel).exists()

    # New heavy metrics should be present depending on task (here, regression)
    if metrics.get('task') == 'regression':
        assert 'r2' in metrics and 'mse' in metrics and 'mae' in metrics
    else:
        assert 'accuracy' in metrics and 'precision' in metrics and 'recall' in metrics and 'f1' in metrics
