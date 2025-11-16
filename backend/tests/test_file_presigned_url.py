from types import SimpleNamespace
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.db.db_models import UserFile
from service.models.key_value import ServiceMode, UserTypes
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.ml_api.ml_api import ml_router


class _FakeFileRepo:
    def __init__(self, record: UserFile | None = None, record_by_name: UserFile | None = None):
        self._record = record
        self._record_by_name = record_by_name

    async def fetch_user_file_by_id(self, user_id, file_id, session=None):
        if self._record and user_id == self._record.user_id and file_id == self._record.id:
            return self._record
        return None

    async def fetch_user_file_by_name(self, user_id, file_name, session=None):
        record = self._record_by_name or self._record
        if record and record.user_id == user_id and record.file_name == file_name:
            return record
        return None


class _FakeTrainingRepo:
    def __init__(self, dataset):
        self._dataset = dataset

    async def get_dataset_by_id(self, user_id, dataset_id, session=None):
        if (
            self._dataset
            and user_id == self._dataset.user_id
            and dataset_id == self._dataset.id
        ):
            return self._dataset
        return None


class _FakeStorage:
    def __init__(self, presigned: str | None):
        self._presigned = presigned

    def build_file_path(self, folder: str, mode: str, file_name: str) -> str:
        return f"{folder}/{mode}/{file_name}"

    async def upload_file(self, *, file_key: str, file_data: bytes) -> str:
        return f"/abs/{file_key}"

    async def delete_file(self, *, file_key: str) -> None:
        pass

    async def get_presigned_url(self, *, file_key: str, expiry_sec: int = 3600) -> str:
        if not self._presigned:
            raise RuntimeError("no presigned available")
        return self._presigned


class _FakeSaver:
    def __init__(self, storage):
        self.storage = storage

    async def get_presigned_url_by_key(self, *, file_key: str, expiry_sec: int = 3600):
        getter = getattr(self.storage, "get_presigned_url")
        return await getter(file_key=file_key, expiry_sec=expiry_sec)


def _build_app(presigned: str | None):
    app = FastAPI()
    from service.presentation.routers.ml_api.ml_api import (
        get_file_repo,
        get_file_saver,
        get_training_repo,
    )

    # Prepare fake record
    user_id = uuid4()
    def _auth():
        return AuthProfile(user_id=user_id, fingerprint=None, type=UserTypes.REGISTERED)
    app.dependency_overrides[check_auth] = _auth
    file_id = uuid4()
    record = UserFile(
        id=file_id,
        user_id=user_id,
        mode=ServiceMode.TRAINING,
        file_name="uploads/TRAINING/abc.csv",
        file_url="/abs/uploads/TRAINING/abc.csv",
    )

    app.dependency_overrides[get_file_repo] = lambda: _FakeFileRepo(record)
    app.dependency_overrides[get_file_saver] = lambda: _FakeSaver(_FakeStorage(presigned))
    app.dependency_overrides[get_training_repo] = lambda: _FakeTrainingRepo(None)
    app.include_router(ml_router)
    return app, record


def _build_dataset_app(
    presigned: str | None,
    *,
    file_repo: _FakeFileRepo,
    dataset,
):
    app = FastAPI()
    from service.presentation.routers.ml_api.ml_api import (
        get_file_repo,
        get_file_saver,
        get_training_repo,
    )

    def _auth():
        return AuthProfile(user_id=dataset.user_id, fingerprint=None, type=UserTypes.REGISTERED)

    app.dependency_overrides[check_auth] = _auth
    app.dependency_overrides[get_file_repo] = lambda: file_repo
    app.dependency_overrides[get_file_saver] = lambda: _FakeSaver(_FakeStorage(presigned))
    app.dependency_overrides[get_training_repo] = lambda: _FakeTrainingRepo(dataset)
    app.include_router(ml_router)
    return app



def _make_dataset():
    user_id = uuid4()
    dataset_id = uuid4()
    file_key = "uploads/TRAINING/dataset.csv"
    return SimpleNamespace(
        id=dataset_id,
        user_id=user_id,
        name=file_key,
        file_url=f"/abs/{file_key}",
    )


def test_dataset_lookup_returns_presigned_url_when_metadata_exists():
    dataset = _make_dataset()
    file_record = UserFile(
        id=uuid4(),
        user_id=dataset.user_id,
        mode=ServiceMode.TRAINING,
        file_name=dataset.name,
        file_url=dataset.file_url,
    )
    app = _build_dataset_app(
        "http://presigned.example.com/file",
        file_repo=_FakeFileRepo(record=None, record_by_name=file_record),
        dataset=dataset,
    )
    client = TestClient(app)
    r = client.get(f"/api/ml/v1/files/{dataset.id}/download-url?expiry_sec=777")
    assert r.status_code == 200
    data = r.json()
    assert data["file_id"] == str(dataset.id)
    assert data["backend"] == "minio"
    assert data["url"].startswith("http://presigned.example.com")
    assert data["expiry_sec"] == 777


def test_dataset_lookup_falls_back_to_dataset_url_when_metadata_missing():
    dataset = _make_dataset()
    app = _build_dataset_app(
        None,
        file_repo=_FakeFileRepo(record=None, record_by_name=None),
        dataset=dataset,
    )
    client = TestClient(app)
    r = client.get(f"/api/ml/v1/files/{dataset.id}/download-url")
    assert r.status_code == 200
    data = r.json()
    assert data["file_id"] == str(dataset.id)
    assert data["backend"] == "local"
    assert data["url"] == dataset.file_url

def test_presigned_success():
    app, record = _build_app("http://presigned.example.com/temp")
    client = TestClient(app)
    r = client.get(f"/api/ml/v1/files/{record.id}/download-url?expiry_sec=123")
    assert r.status_code == 200
    data = r.json()
    assert data["file_id"] == str(record.id)
    assert data["url"].startswith("http://presigned.example.com")
    assert data["expiry_sec"] == 123
    assert data["backend"] == "minio"


def test_presigned_fallback_local():
    app, record = _build_app(None)
    client = TestClient(app)
    r = client.get(f"/api/ml/v1/files/{record.id}/download-url")
    assert r.status_code == 200
    data = r.json()
    assert data["url"] == record.file_url  # fallback
    assert data["backend"] == "local"
