import uuid
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.key_value import UserTypes
from service.presentation.routers.ml_api import ml_api as ml_module
from service.presentation.routers.ml_api.ml_api import (
    get_file_saver,
    get_training_repo,
    ml_router,
)


_TEST_USER_ID = uuid.uuid4()


class _FakeSaver:
    async def get_presigned_url_by_key(self, file_key, expiry_sec=3600):  # pragma: no cover
        return None


class _FakeTrainingRepo:
    def __init__(self, user_id):
        self._user_id = user_id
        self._store: dict[uuid.UUID, str] = {}

    async def list_artifacts(self, user_id, limit=20):  # pragma: no cover
        raise NotImplementedError

    async def delete_artifact(self, user_id, artifact_id):
        if artifact_id not in self._store or user_id != self._user_id:
            return None
        return self._store.pop(artifact_id)

    async def get_artifact_by_id(self, user_id, artifact_id):
        if artifact_id not in self._store:
            return None
        if user_id != self._user_id:
            return None
        return SimpleNamespace(id=artifact_id, model_url=self._store[artifact_id], user_id=user_id)


def _fake_auth() -> AuthProfile:
    return AuthProfile(user_id=_TEST_USER_ID, fingerprint=None, type=UserTypes.REGISTERED)


def _build_app(fake_repo: _FakeTrainingRepo, fake_saver: _FakeSaver | None = None):
    app = FastAPI()
    app.include_router(ml_router)
    app.dependency_overrides[get_training_repo] = lambda: fake_repo
    app.dependency_overrides[ml_module.check_auth] = _fake_auth
    app.dependency_overrides[get_file_saver] = lambda: fake_saver or _FakeSaver()
    return app


def test_delete_artifact_success(tmp_path, monkeypatch):
    # Prepare a file on disk matching the URL
    storage_root = tmp_path
    models_dir = storage_root / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    file_path = models_dir / "to_delete.pkl"
    file_path.write_bytes(b"x")
    monkeypatch.setenv("STORAGE_ROOT", str(storage_root))

    # Fake repo with artifact id -> url mapping
    fake_repo = _FakeTrainingRepo(_TEST_USER_ID)
    art_id = uuid.uuid4()
    fake_repo._store[art_id] = "/storage/models/to_delete.pkl"

    app = _build_app(fake_repo)
    client = TestClient(app)

    resp = client.delete(f"/api/ml/v1/artifacts/{art_id}")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["id"] == str(art_id)

    # File is removed
    assert not file_path.exists()


def test_delete_artifact_not_found():
    fake_repo = _FakeTrainingRepo(_TEST_USER_ID)
    app = _build_app(fake_repo)
    client = TestClient(app)

    resp = client.delete(f"/api/ml/v1/artifacts/{uuid.uuid4()}")
    assert resp.status_code == 404


def test_get_artifact_download_url_and_stream(tmp_path, monkeypatch):
    storage_root = tmp_path
    models_dir = storage_root / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    file_path = models_dir / "model.joblib"
    file_path.write_bytes(b"binary")
    monkeypatch.setenv("STORAGE_ROOT", str(storage_root))

    fake_repo = _FakeTrainingRepo(_TEST_USER_ID)
    art_id = uuid.uuid4()
    fake_repo._store[art_id] = "/storage/models/model.joblib"

    app = _build_app(fake_repo)
    client = TestClient(app)

    resp = client.get(f"/api/ml/v1/artifacts/{art_id}/download-url")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["backend"] == "local"
    assert data["url"].endswith(f"/artifacts/{art_id}/download")

    download_resp = client.get(data["url"])
    assert download_resp.status_code == 200
    assert download_resp.content == b"binary"


def test_download_artifact_missing_file(tmp_path, monkeypatch):
    monkeypatch.setenv("STORAGE_ROOT", str(tmp_path))
    fake_repo = _FakeTrainingRepo(_TEST_USER_ID)
    art_id = uuid.uuid4()
    fake_repo._store[art_id] = "/storage/models/missing.joblib"

    app = _build_app(fake_repo)
    client = TestClient(app)

    resp = client.get(f"/api/ml/v1/artifacts/{art_id}/download")
    assert resp.status_code == 404
