import uuid
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.key_value import ServiceMode, UserTypes
from service.presentation.routers.ml_api import ml_api as ml_module
from service.presentation.routers.ml_api.ml_api import (
    get_file_repo,
    get_file_saver,
    get_training_repo,
    ml_router,
)


class _FakeStorage:
    def __init__(self):
        self.deleted_keys: list[str] = []

    async def delete_file(self, *, file_key: str) -> None:  # pragma: no cover - simple
        self.deleted_keys.append(file_key)


class _FakeSaver:
    def __init__(self):
        self.storage = _FakeStorage()


class _FakeFileRepo:
    def __init__(self):
        self.deleted_names: list[str] = []

    async def delete_file_metadata_by_name(self, user_id, file_name):
        self.deleted_names.append(file_name)


class _FakeTrainingRepo:
    def __init__(self, dataset):
        self.dataset = dataset
        self.deleted_ids: list[uuid.UUID] = []

    async def get_dataset_by_id(self, user_id, dataset_id):
        if self.dataset and dataset_id == self.dataset.id and user_id == self.dataset.user_id:
            return self.dataset
        return None

    async def delete_dataset(self, user_id, dataset_id):
        if self.dataset and dataset_id == self.dataset.id and user_id == self.dataset.user_id:
            self.deleted_ids.append(dataset_id)
            return True
        return False


def _fake_auth(user_id):
    return AuthProfile(user_id=user_id, fingerprint=None, type=UserTypes.REGISTERED)


def _build_app(dataset=None):
    app = FastAPI()
    app.include_router(ml_router)

    training_repo = _FakeTrainingRepo(dataset)
    file_repo = _FakeFileRepo()
    saver = _FakeSaver()

    app.dependency_overrides[get_training_repo] = lambda: training_repo
    app.dependency_overrides[get_file_repo] = lambda: file_repo
    app.dependency_overrides[get_file_saver] = lambda: saver
    user_id = dataset.user_id if dataset else uuid.uuid4()
    app.dependency_overrides[ml_module.check_auth] = lambda: _fake_auth(user_id)

    return app, training_repo, file_repo, saver


def test_delete_dataset_removes_metadata_and_storage():
    dataset = SimpleNamespace(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        storage_key="uploads/TRAINING/file.csv",
        name="file.csv",
        file_url="/storage/uploads/TRAINING/file.csv",
        mode=ServiceMode.TRAINING,
        created_at=None,
    )
    app, training_repo, file_repo, saver = _build_app(dataset)
    client = TestClient(app)

    resp = client.delete(f"/api/ml/v1/datasets/{dataset.id}")
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["dataset_id"] == str(dataset.id)
    assert payload["deleted"] is True
    assert payload["file_removed"] is True
    assert payload["file_metadata_deleted"] is True
    assert training_repo.deleted_ids == [dataset.id]
    assert file_repo.deleted_names == [dataset.storage_key]
    assert saver.storage.deleted_keys == [dataset.storage_key]


def test_delete_dataset_returns_404_for_unknown_id():
    dataset = SimpleNamespace(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        storage_key="uploads/TRAINING/file.csv",
        name="file.csv",
        file_url="/storage/uploads/TRAINING/file.csv",
        mode=ServiceMode.TRAINING,
        created_at=None,
    )
    app, _, _, _ = _build_app(dataset)
    client = TestClient(app)

    resp = client.delete(f"/api/ml/v1/datasets/{uuid.uuid4()}")
    assert resp.status_code == 404
    assert "не найден" in resp.json()["detail"].lower()
