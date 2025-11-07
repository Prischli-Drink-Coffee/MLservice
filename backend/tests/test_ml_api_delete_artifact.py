import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

from service.models.auth_models import AuthProfile
from service.models.key_value import UserTypes
from service.presentation.routers.ml_api import ml_api as ml_module
from service.presentation.routers.ml_api.ml_api import get_training_repo, ml_router


class _FakeTrainingRepo:
    def __init__(self):
        self._store: dict[uuid.UUID, str] = {}

    async def list_artifacts(self, user_id, limit=20):  # pragma: no cover
        raise NotImplementedError

    async def delete_artifact(self, user_id, artifact_id):
        # Simulate ownership by simply checking presence
        return self._store.pop(artifact_id, None)


def _fake_auth() -> AuthProfile:
    return AuthProfile(user_id=uuid.uuid4(), fingerprint=None, type=UserTypes.REGISTERED)


def _build_app(fake_repo: _FakeTrainingRepo):
    app = FastAPI()
    app.include_router(ml_router)
    app.dependency_overrides[get_training_repo] = lambda: fake_repo
    app.dependency_overrides[ml_module.check_auth] = _fake_auth
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
    fake_repo = _FakeTrainingRepo()
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
    fake_repo = _FakeTrainingRepo()
    app = _build_app(fake_repo)
    client = TestClient(app)

    resp = client.delete(f"/api/ml/v1/artifacts/{uuid.uuid4()}")
    assert resp.status_code == 404
