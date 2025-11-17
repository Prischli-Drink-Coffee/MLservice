import uuid
from datetime import datetime, timezone
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


_TEST_USER_ID = uuid.uuid4()


def _fake_auth() -> AuthProfile:
    return AuthProfile(user_id=_TEST_USER_ID, fingerprint=None, type=UserTypes.REGISTERED)


class _FakeTrainingRepo:
    def __init__(self, datasets):
        self._datasets = datasets

    async def list_datasets(self, user_id, limit=20):
        return self._datasets[:limit]


class _FakeFileRepo:
    def __init__(self, mapping=None):
        self._mapping = mapping or {}

    async def fetch_user_file_by_name(self, user_id, file_name):  # pragma: no cover
        return self._mapping.get(file_name)


class _FakeSaver:
    async def get_presigned_url_by_key(self, file_key, expiry_sec=3600):  # pragma: no cover
        return None


def _build_app(fake_repo, fake_file_repo=None, fake_saver=None):
    app = FastAPI()
    app.include_router(ml_router)
    app.dependency_overrides[get_training_repo] = lambda: fake_repo
    app.dependency_overrides[get_file_repo] = lambda: fake_file_repo or _FakeFileRepo()
    app.dependency_overrides[get_file_saver] = lambda: fake_saver or _FakeSaver()
    app.dependency_overrides[ml_module.check_auth] = _fake_auth
    return app


def test_list_datasets_includes_columns(tmp_path, monkeypatch):
    csv_path = tmp_path / "datasets" / "train.csv"
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    csv_path.write_text("feature,target\n1,0\n", encoding="utf-8")
    monkeypatch.setenv("STORAGE_ROOT", str(tmp_path))

    dataset = SimpleNamespace(
        id=uuid.uuid4(),
        user_id=_TEST_USER_ID,
        launch_id=None,
        mode=ServiceMode.TRAINING,
        name="train.csv",
        storage_key="datasets/train.csv",
        file_url=str(csv_path),
        version=1,
        created_at=datetime.now(timezone.utc),
    )

    fake_repo = _FakeTrainingRepo([dataset])
    app = _build_app(fake_repo)
    client = TestClient(app)

    resp = client.get("/api/ml/v1/datasets")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert len(data) == 1
    assert data[0]["columns"] == ["feature", "target"]